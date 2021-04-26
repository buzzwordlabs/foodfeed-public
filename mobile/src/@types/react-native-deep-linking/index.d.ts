declare module "react-native-deep-linking" {
  /**
   * Missing a few types, but includes all properties currently being used
   */
  export type AddRouteCallbackArgs = { path: string; scheme: string };
  export type AddRouteCallback<T> = (
    response: AddRouteCallbackArgs & T
  ) => void;
  export type Expression = string | RegExp;
  export type Route<T> = {
    expression: Expression;
    callback: AddRouteCallback<T>;
  };
  export type Routes<T> = Route<T>[];
  export type Scheme = string;

  export default class DeepLinking {
    static addRoute: <T>(
      expression: Expression,
      callback: AddRouteCallback<T>
    ) => void;
    static addScheme: (scheme: string) => void;
    static evaluateUrl: (url: string) => void;
    static removeRoute: (expression: Expression) => void;
    static resetSchemes: () => void;
    static resetRoutes: () => void;
  }
}
