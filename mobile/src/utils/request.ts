import axios, { AxiosResponse as BaseAxiosResponse, Method } from "axios";

import ENV from "../../env";
import { bugsnag } from "../utils/bugsnag";
import { checkInternetConnection } from "react-native-offline";
import { showBanner } from "./banner";
import { readCache } from "./cache";

export interface AxiosResponse extends BaseAxiosResponse {
  ok: boolean;
}

export interface RequestArgs {
  url: string;
  method: Method;
  body?: any;
  optionalHeaders?: any;
  params?: any;
}

const request = async ({
  url,
  method,
  body,
  params,
  optionalHeaders,
}: RequestArgs): Promise<AxiosResponse> => {
  let response: AxiosResponse;
  try {
    const authToken = await readCache("authToken");

    bugsnag.leaveBreadcrumb("request", {
      type: "request",
      endpoint: url,
      method,
      body,
      params,
      optionalHeaders,
    });
    const internetActive = await checkInternetConnection();
    if (!internetActive) {
      showBanner({
        message: "Your internet connection is off 📡",
        description: "Please attempt to reconnect to the Internet.",
        type: "danger",
      });
    }
    response = {
      ok: true,
      ...(await axios({
        url,
        method: method,
        data: body,
        params: { ...params, apiVersion: ENV.USE_API_VERSION },
        baseURL: ENV.API_BASE_URL,
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        timeout: 10000,
        ...optionalHeaders,
      })),
    };
    return response;
  } catch (err) {
    if (err.response) {
      err.response.ok = false;
      return err.response;
    } else {
      err.ok = false;
      return err;
    }
  }
};

export { request };
