import dotenv from 'dotenv';
dotenv.config();
import {
  pgPool,
  S3_BUCKET,
  S3_USER_STREAM_RECORDING_KEY_FOLDER,
  s3,
  logger
} from './utils';
import path from 'path';
import chokidar from 'chokidar';
import child_process from 'child_process';
import util from 'util';
import { promises as fs, createReadStream } from 'fs';
import readline from 'readline';
import * as db from './zapatos/src';
import * as s from './zapatos/schema';
const exec = util.promisify(child_process.exec);

logger.info('STARTING JANUS STREAM SAVER');

const cleanupConnectionsOnCrash = () => {
  pgPool.end().catch;
};

process.on('unhandledRejection', (reason, promise) => {
  console.error(`Unhandled Rejection at:', ${promise}\n, 'reason:', ${reason}`);
  cleanupConnectionsOnCrash();
  process.exit(1);
});

process.on('uncaughtException', (err: Error) => {
  console.error(`Caught Exception ${err}\n`);
  cleanupConnectionsOnCrash();
  process.exit(1);
});

const completedConversions: {
  [index: string]: { audio?: string; video?: string; text?: string };
} = {};

const fileType = (codec: string) => {
  switch (codec) {
    case 'h.264':
      return ['video', '.mp4'];
    case 'vp8':
      return ['video', '.webm'];
    case 'vp9':
      return ['video', '.webm'];
    case 'opus':
      return ['audio', '.opus'];
    case 'g.711':
      return ['audio', '.wav'];
    case 'text':
      return ['text', '.srt'];
  }
};

const awsUploadWatcher = chokidar.watch('/janus/recordings/*-final.mp4', {
  persistent: true
});

const janusRecordingOutputWatcher = chokidar.watch('/janus/recordings/*.mjr', {
  persistent: true
});

const getFfmpegRangeCommand = (range: string) => {
  const rangeSplit = range.split(' ');
  return rangeSplit[0] + ' -to ' + rangeSplit[2];
};

const makeFinalWithSplicingAndRotating = async (
  pathWithoutExtension: string
) => {
  // format is [[number as string, range as 00:00:19.860 --> 00:00:29.886, portrait/landscape as string]]
  const events = [];
  const fileStream = createReadStream(`${pathWithoutExtension}.srt`);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  let currentLine = 0;
  let currentTupleIndex = 0;
  let currentTuple = ['', '', ''];
  for await (const line of rl) {
    if (currentLine === 3) {
      currentLine = 0;
      currentTupleIndex += 1;
      events.push(currentTuple);
      currentTuple = ['', '', ''];
      continue;
    }
    if (currentLine === 0 || currentLine === 1 || currentLine === 2) {
      currentTuple[currentLine] = line;
      currentLine = currentLine + 1;
    }
  }
  let index = 0;
  let ffmpegInputs = '';
  const tempPathTxt = `${pathWithoutExtension}-temp.txt`;
  for await (const tuple of events) {
    const tempWithIndexPath = `${pathWithoutExtension}-temp${index}.mp4`;
    const tempWithIndexTransposePath = `${pathWithoutExtension}-temp${index}-tr.mp4`;
    await exec(
      `ffmpeg -y -i ${pathWithoutExtension}-temp.mp4 -ss ${getFfmpegRangeCommand(
        tuple[1]
      )} -async 1 ${tempWithIndexPath}`
    );
    if (tuple[2] === 'portrait') {
      await exec(
        `ffmpeg -y -i ${tempWithIndexPath} -vf "transpose=3,hflip" ${tempWithIndexTransposePath}`
      );
    } else {
      await exec(`mv ${tempWithIndexPath} ${tempWithIndexTransposePath}`);
    }
    ffmpegInputs += `file '${tempWithIndexTransposePath}'\n`;
    index += 1;
  }
  await fs.writeFile(`${tempPathTxt}`, ffmpegInputs);
  await exec(
    `ffmpeg -y -f concat -safe 0 -i ${tempPathTxt} -c copy ${pathWithoutExtension}-final.mp4`
  );
};

const convertToFinalMp4 = async (
  pathWithoutExtension: string,
  audio: string,
  video: string
) => {
  try {
    if (audio === '.wav' && video === '.mp4') {
      const webmFfmpegConv = await exec(
        `ffmpeg -y -i ${pathWithoutExtension}.wav -i ${pathWithoutExtension}.mp4 -c:v copy -c:a pcm_s16le -strict experimental ${pathWithoutExtension}-temp.mp4`
      );
      await makeFinalWithSplicingAndRotating(pathWithoutExtension);
    } else if (audio === '.opus' && video === '.mp4') {
      const webmFfmpegConv = await exec(
        `ffmpeg -y -i ${pathWithoutExtension}.opus -i ${pathWithoutExtension}.mp4 -c:v copy -c:a opus -strict experimental ${pathWithoutExtension}-temp.mp4`
      );
      await makeFinalWithSplicingAndRotating(pathWithoutExtension);
    } else if (audio === '.wav' && video === '.webm') {
      const webmFfmpegConv = await exec(
        `ffmpeg -y -i ${pathWithoutExtension}.wav -i ${pathWithoutExtension}.webm -c:v copy -c:a pcm_s16le -strict experimental ${pathWithoutExtension}-final.webm`
      );
      const mp4FfmpegConv = await exec(
        `ffmpeg -y -i ${pathWithoutExtension}-final.webm ${pathWithoutExtension}-temp.mp4`
      );
      await makeFinalWithSplicingAndRotating(pathWithoutExtension);
    } else if (audio === '.opus' && video === '.webm') {
      const webmFfmpegConv = await exec(
        `ffmpeg -y -i ${pathWithoutExtension}.opus -i ${pathWithoutExtension}.webm -c:v copy -c:a opus -strict experimental ${pathWithoutExtension}-final.webm`
      );
      const mp4FfmpegConv = await exec(
        `ffmpeg -y -i ${pathWithoutExtension}-final.webm ${pathWithoutExtension}-temp.mp4`
      );
      await makeFinalWithSplicingAndRotating(pathWithoutExtension);
    }
  } catch (err) {
    logger.error('CONVERT TO FINAL MP4()', err);
    await exec(`rm -rf ${pathWithoutExtension}*`);
  }
};

janusRecordingOutputWatcher.on('add', async (loc) => {
  try {
    const basenameWithAVSuffix = path.basename(loc, '.mjr');
    let basename;
    if (basenameWithAVSuffix.includes('audio'))
      basename = basenameWithAVSuffix.split('-audio')[0];
    else if (basenameWithAVSuffix.includes('video'))
      basename = basenameWithAVSuffix.split('-video')[0];
    else if (basenameWithAVSuffix.includes('data'))
      basename = basenameWithAVSuffix.split('-data')[0];
    else return;
    const headers = await exec(
      `/janus/recordings/janus-pp-rec --header ${loc}`
    );
    const codecStart = headers.stdout.indexOf('Codec: ');
    const codecEnd = headers.stdout.indexOf('\n', codecStart);
    const spliceCodec = headers.stdout
      .slice(codecStart + 6, codecEnd)
      .toLowerCase()
      .trim();

    const dirname = path.dirname(loc);
    const pathWithoutExtension = `${dirname}/${basename}`;

    const fileInfo = fileType(spliceCodec);

    if (fileInfo) {
      const janusMjrConv = await exec(
        `/janus/recordings/janus-pp-rec ${loc} ${pathWithoutExtension}${fileInfo[1]}`
      );
      if (!completedConversions[basename]) {
        completedConversions[basename] = {};
      }
      if (fileInfo[0] === 'audio') {
        completedConversions[basename].audio = fileInfo[1];
        if (
          completedConversions[basename].video &&
          completedConversions[basename].text
        ) {
          return convertToFinalMp4(
            pathWithoutExtension,
            completedConversions[basename].audio!,
            completedConversions[basename].video!
          );
        }
      }
      if (fileInfo[0] === 'video') {
        completedConversions[basename].video = fileInfo[1];
        if (
          completedConversions[basename].audio &&
          completedConversions[basename].text
        ) {
          return convertToFinalMp4(
            pathWithoutExtension,
            completedConversions[basename].audio!,
            completedConversions[basename].video!
          );
        }
      }
      if (fileInfo[0] === 'text') {
        completedConversions[basename].text = fileInfo[1];
        if (
          completedConversions[basename].audio &&
          completedConversions[basename].video
        ) {
          return convertToFinalMp4(
            pathWithoutExtension,
            completedConversions[basename].audio!,
            completedConversions[basename].video!
          );
        }
      }
    } else {
      logger.error('CODEC NOT RECOGNIZED, ', spliceCodec);
      await exec(`rm -rf /janus/recordings/${basename}*`);
    }
  } catch (err) {
    logger.error('JANUS RECORDING OUTPUT WATCHER()', err);
  }
});

awsUploadWatcher.on('add', async (loc) => {
  try {
    const data = await fs.readFile(loc);
    const extname = path.extname(loc);
    // Remove the substring "-final" from the string
    const basenameWithoutExtension = path.basename(loc).split('-final')[0];
    const basename = basenameWithoutExtension + extname;

    const params = {
      Bucket: S3_BUCKET,
      Key: S3_USER_STREAM_RECORDING_KEY_FOLDER + '/' + path.basename(basename),
      Body: data,
      ACL: 'public-read'
    };
    const uploadedVal = await s3.upload(params).promise();
    await db.sql<
      s.stream_history.SQL
    >`UPDATE stream_history SET ${'uri'} = ${db.param(
      uploadedVal.Location
    )} WHERE ${'id'} = ${db.param(basenameWithoutExtension)}`.run(pgPool);

    await exec(`rm -rf /janus/recordings/${basenameWithoutExtension}*`);
    delete completedConversions[basenameWithoutExtension];
  } catch (err) {
    logger.error('AWS UPLOAD WATCHER()', err);
    const basenameWithoutExtension = path.basename(loc).split('-final')[0];
    await exec(`rm -rf /janus/recordings/${basenameWithoutExtension}*`);
  }
});
