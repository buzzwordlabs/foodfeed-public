import React, { useEffect, useState } from "react";
import { Theme, themes, resolveTheme, ThemeOptions } from "../constants";
import { writeCache, readCache } from "../utils";

export type ContextProps = { setTheme: SetTheme } & State;

type Props = { children: React.ReactNode };

type SetTheme = (themeName: ThemeOptions) => void;

type State = { themeName: ThemeOptions } & Theme;

const initialState: State = { ...themes.dark, themeName: "dark" };

const ThemeContext = React.createContext<ContextProps>(
  (null as unknown) as ContextProps
);

const ThemeContextProvider = (props: Props) => {
  const [themeState, setThemeState] = useState(initialState);

  useEffect(() => {
    (async () => {
      const themeName = await readCache("themeName");
      if (themeName) setTheme(themeName);
    })();
  }, []);

  useEffect(() => {
    (async () => writeCache("themeName", themeState.themeName))();
  }, [themeState.themeName]);

  const setTheme: SetTheme = (themeName) =>
    setThemeState(resolveTheme(themeName));

  return (
    <ThemeContext.Provider value={{ ...themeState, setTheme }}>
      {props.children}
    </ThemeContext.Provider>
  );
};

export { ThemeContext, ThemeContextProvider };
