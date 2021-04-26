import { redis } from '../utils';

import { DeviceRedisInfo } from '../types';
import { difference } from 'lodash';
import ioJanusManagerClient from 'socket.io-client';
import {
  JanusManagerRedisData,
  JanusManagerToServerEvents,
  JanusManagerToClientEvents,
  SocketClientConnectionEvents
} from './constants';

// string is a url
type activeManagerConnections = {
  [index: string]: SocketIOClient.Socket;
};
const activeManagerConnections: activeManagerConnections = {};
let activeManagerConnectionsUrls: string[] = [];
let activeConnectionIndex = 0;

type JanusManagerSession = {
  deviceId: string;
  isStreaming: boolean;
  createdAt: string;
  updatedAt: string;
};

export const createClientConnection = (io: SocketIO.Server, url: string) => {
  const janusManagerSocketConn = ioJanusManagerClient.connect(url, {
    reconnectionAttempts: 10
  });

  janusManagerSocketConn.on(SocketClientConnectionEvents.CONNECT, () => {});
  janusManagerSocketConn.on(SocketClientConnectionEvents.DISCONNECT, () => {});
  janusManagerSocketConn.on(
    SocketClientConnectionEvents.RECONNECT_FAILED,
    async () => {
      await redis.hdel(JanusManagerRedisData.JANUSMANAGERS, url);
      const index = activeManagerConnectionsUrls.indexOf(url);
      if (index > -1) {
        activeManagerConnectionsUrls.splice(index, 1);
      }
      delete activeManagerConnections[url];
    }
  );
  janusManagerSocketConn.on(
    JanusManagerToServerEvents.JANUS_MANAGER_CRASHED,
    (streamers: JanusManagerSession[]) => {
      streamers.map((streamer) => {
        io.in(streamer.deviceId).emit(
          JanusManagerToClientEvents.VIDEO_STREAM_CRASHED
        );
      });
    }
  );
  return janusManagerSocketConn;
};

export const retrieveRoundRobinConnection = async (): Promise<{
  janusManagerSocket: SocketIOClient.Socket;
  janusManagerUrl: string;
}> => {
  const janusManagerUrl = activeManagerConnectionsUrls[activeConnectionIndex];
  const janusManagerUrlStatus = await redis.hget(
    JanusManagerRedisData.JANUSMANAGERSTATUS,
    janusManagerUrl
  );
  if (janusManagerUrlStatus === 'off') {
    activeConnectionIndex =
      (activeConnectionIndex + 1) % activeManagerConnectionsUrls.length;
    return retrieveRoundRobinConnection();
  }
  const janusManagerSocket =
    activeManagerConnections[
      activeManagerConnectionsUrls[activeConnectionIndex]
    ];
  activeConnectionIndex =
    (activeConnectionIndex + 1) % activeManagerConnectionsUrls.length;
  return { janusManagerSocket, janusManagerUrl };
};

export const getClientConnection = (url: string) => {
  return activeManagerConnections[url];
};

export const retrieveRedisClientConnectionUrl = async (deviceId: string) => {
  const janusSession: keyof Pick<DeviceRedisInfo, 'janusSession'> =
    'janusSession';
  const janusManagerUrl = await redis.hget(deviceId, janusSession);
  if (!janusManagerUrl) return undefined;
  return janusManagerUrl;
};
export const retrieveClientConnectionFromRedis = async (deviceId: string) => {
  const janusManagerUrl = await retrieveRedisClientConnectionUrl(deviceId);
  if (!janusManagerUrl) return undefined;
  return getClientConnection(janusManagerUrl);
};

export const initManagerConnections = async (io: SocketIO.Server) => {
  const janusManagerRedisUrls = await redis.hgetall(
    JanusManagerRedisData.JANUSMANAGERS
  );
  const urls = Object.keys(janusManagerRedisUrls);
  const newConnections = difference(urls, activeManagerConnectionsUrls);
  newConnections.map((url) => {
    activeManagerConnections[url] = createClientConnection(io, url);
  });
  const removedConnections = difference(activeManagerConnectionsUrls, urls);
  removedConnections.map((url) => delete activeManagerConnections[url]);
  activeManagerConnectionsUrls = urls;
};
