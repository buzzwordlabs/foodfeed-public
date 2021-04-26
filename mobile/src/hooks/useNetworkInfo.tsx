import NetInfo, {
  NetInfoState,
  NetInfoStateType,
} from "@react-native-community/netinfo";
import { useEffect, useState } from "react";
import { isEqual } from "lodash";

const useNetworkInfo = () => {
  const [networkState, setNetworkState] = useState<NetInfoState>({
    type: NetInfoStateType.other,
    isConnected: true,
    isInternetReachable: true,
    details: {
      isConnectionExpensive: false,
    },
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (!isEqual(state, networkState)) setNetworkState(state);
    });
    return unsubscribe;
  }, []);

  return [networkState];
};

export default useNetworkInfo;
