import {
  AxiosResponse,
  RequestArgs,
  request as defaultRequest,
  showBanner,
} from "../utils";

import useLogout from "./useLogout";
import { useState } from "react";

type UseRequestWithLoadingReturnType = [
  (requestArgs: RequestArgs) => Promise<AxiosResponse>,
  boolean
];

type UseRequestReturnType = [
  (requestArgs: RequestArgs) => Promise<AxiosResponse>
];

const useLoadingRequest = (
  { requireAuth }: { requireAuth?: boolean } = { requireAuth: true }
): UseRequestWithLoadingReturnType => {
  const [nonLoadingRequest] = useRequest({ requireAuth });
  const [loading, setLoading] = useState(false);

  const request = async (requestArgs: RequestArgs) => {
    setLoading(true);
    const response = await nonLoadingRequest(requestArgs);
    setLoading(false);
    return response;
  };

  return [request, loading];
};

const useRequest = (
  { requireAuth = true }: { requireAuth?: boolean } = { requireAuth: true }
): UseRequestReturnType => {
  const [logout] = useLogout();

  const request = async (requestArgs: RequestArgs) => {
    const response = await defaultRequest(requestArgs);
    if (requireAuth && (response.status === 403 || response.status === 401)) {
      showBanner({ message: "Please log in again.", type: "danger" });
      await logout({ noPrompt: true });
    }
    return response;
  };
  return [request];
};

export { useRequest, useLoadingRequest };
