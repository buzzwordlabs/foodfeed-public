import AsyncStorage from "@react-native-community/async-storage";

export enum TemporaryCacheKeysEnum {
  userId = "userId",
  authToken = "authToken",
  firstName = "firstName",
  lastName = "lastName",
  username = "username",
  bio = "bio",
  avatar = "avatar",
  onboardingStep = "onboardingStep",
  themeName = "themeName",
  tooltipData = "tooltipData",
  recentlySearchedUsers = "recentlySearchedUsers",
  notificationToken = "notificationToken",
  askedInitialRequestPermissions = "askedInitialRequestPermissions",
}

export enum PermanentCacheKeysEnum {
  "seenIntro" = "seenIntro",
}

// Complex and require more type checking
export enum SpecialCacheKeysEnum {
  "badgeStatus" = "badgeStatus",
}

export enum BadgeStatusEnum {
  conversations = "conversations",
  activity = "activity",
}

export type BadgeStatus = { [key in BadgeStatusKeys]: number };

export type BadgeStatusKeys = keyof typeof BadgeStatusEnum;

export type TemporaryCacheKey = keyof typeof TemporaryCacheKeysEnum;

export type SpecialCacheKey = keyof typeof SpecialCacheKeysEnum;

export type PermanentCacheKey = keyof typeof PermanentCacheKeysEnum;

export type CacheKeys = TemporaryCacheKey | PermanentCacheKey;

type CacheData = string | number | boolean | object;

const readCacheUtil = async (name: CacheKeys | SpecialCacheKey) => {
  const data: string | null = await AsyncStorage.getItem(name);
  if (data === null) {
    return null;
  }
  const cleansedData: any = parse(data);
  return cleansedData;
};

const readCache = async (name: CacheKeys) => {
  return readCacheUtil(name);
};

const writeCacheUtil = async (
  name: SpecialCacheKey | TemporaryCacheKey,
  data: CacheData
) => AsyncStorage.setItem(name, stringify(data));

const writeCache = async (name: TemporaryCacheKey, data: CacheData) =>
  writeCacheUtil(name, data);

const writeCachePermanent = async (name: PermanentCacheKey, data: CacheData) =>
  AsyncStorage.setItem(name, stringify(data));

const deleteCache = async (name: CacheKeys) => AsyncStorage.removeItem(name);

type StringIndexableObject = {
  [name: string]: string | object | boolean;
};

type KVPair = [CacheKeys, CacheData];

type StringifiedKVPair = [string, string];

const readCacheMulti = async (keys: CacheKeys[]): Promise<any> => {
  const data: StringIndexableObject = {};
  const kvPairs = await AsyncStorage.multiGet(keys);
  kvPairs.forEach((pair: [string, string | null]) => {
    if (pair[1] !== null && pair[0] !== null) {
      data[pair[0]] = parse(pair[1]);
    }
  });
  return data;
};

const writeCacheMulti = async (kvPairsArray: KVPair[]) => {
  const cleansedKvPairs: StringifiedKVPair[] = await Promise.all(
    kvPairsArray.map(
      (pair: any): StringifiedKVPair => {
        return [pair[0] || "", stringify(pair[1]) || ""];
      }
    )
  );
  await AsyncStorage.multiSet(cleansedKvPairs);
};

const deleteCacheMulti = async (keys: CacheKeys[]) =>
  AsyncStorage.multiRemove(keys);

const readCacheAll = async () => {
  const data: StringIndexableObject = {};
  const keys = await AsyncStorage.getAllKeys();
  const kvPairs = (await AsyncStorage.multiGet(keys)) as [CacheKeys, any][];
  const nonNullKvPairs = filterNull(kvPairs);
  nonNullKvPairs.forEach((pair) => (data[pair[0]] = parse(pair[1])));
  return data;
};

const filterNull = (kvPairs: [CacheKeys, any][]) =>
  kvPairs.filter((pair) => pair[1] !== null);

// Avoid deleting permanent keys
const deleteCacheAll = async () => deleteCacheAllExcept([]);

const deleteCacheAllExcept = async (keepKeys: CacheKeys[]) => {
  const allKeys = (await readCacheAllKeys()) as CacheKeys[];
  const keysToDelete = allKeys.filter(
    (keyToBeDeleted) =>
      !keepKeys.includes(keyToBeDeleted) &&
      !Object.keys(PermanentCacheKeysEnum).includes(keyToBeDeleted)
  ) as CacheKeys[];
  await deleteCacheMulti(keysToDelete);
};

const readCacheAllKeys = async () =>
  AsyncStorage.getAllKeys() as Promise<CacheKeys[]>;

// Helpers
const stringify = (data: CacheData): string => {
  let stringified: string;
  try {
    stringified = JSON.stringify(data);
  } catch (err) {
    stringified = String(data);
  }
  return stringified;
};

const parse = <T>(data: string): T => {
  let parsed: any;
  try {
    parsed = JSON.parse(data);
  } catch (err) {
    parsed = data;
  }
  return parsed;
};

export {
  writeCache,
  writeCachePermanent,
  readCache,
  deleteCache,
  writeCacheMulti,
  readCacheMulti,
  deleteCacheMulti,
  readCacheAll,
  deleteCacheAll,
  readCacheAllKeys,
  deleteCacheAllExcept,
};
