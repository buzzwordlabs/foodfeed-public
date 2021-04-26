import Amplitude, {
  AmplitudeRequestData,
  AmplitudeRequestDataOptions,
  AmplitudeTrackResponse
} from 'amplitude';
import { AMPLITUDE_API_KEY, IS_PRODUCTION } from '../config';

const amplitude = new Amplitude(AMPLITUDE_API_KEY!);

export const track = async (
  data: AmplitudeRequestData | Array<AmplitudeRequestData>,
  options?: AmplitudeRequestDataOptions
): Promise<AmplitudeTrackResponse | undefined> => {
  if (IS_PRODUCTION) {
    return amplitude.track(data, options);
  }
};
