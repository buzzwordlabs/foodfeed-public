import {
  AMPLITUDE_LIFETIME_EVENTS,
  amplitudeTrack,
  showBanner,
  writeCache,
} from "../../utils";
import {
  Button,
  HighlightSelect,
  ParentView,
  Text,
  HeaderTextButton,
} from "../../components";
import React, { useContext, useEffect, useState } from "react";

import { GlobalContext } from "../../contexts";
import { OnboardingStackNavProps } from "../../navigation";
import { View } from "react-native";
import { useLoadingRequest } from "../../hooks";

interface State {
  topics: {
    id: string;
    name: string;
    selected: boolean;
  }[];
  receivedInitResponse: boolean;
  postRequestLoading: boolean;
}

const initialState: State = {
  topics: [],
  receivedInitResponse: false,
  postRequestLoading: false,
};

type Props = OnboardingStackNavProps<"SelectInterests">;

const SelectTopics = (props: Props) => {
  const [state, setState] = useState(initialState);
  const global = useContext(GlobalContext);
  const [request] = useLoadingRequest();

  const hasSelectedInterests =
    state.topics.filter((t) => t.selected).length > 0;

  props.navigation.setOptions({
    title: "Interests",
    headerRight: () => {
      return (
        !hasSelectedInterests && (
          <HeaderTextButton
            title="Skip"
            onPress={async () => {
              await request({
                url: "/user/topics/",
                method: "POST",
                body: {},
              });
              await writeCache("onboardingStep", 0);
              global.setState({ onboardingStep: 0 });
            }}
          />
        )
      );
    },
  });

  useEffect(() => {
    (async () => {
      const response = await request({
        url: "/user/topics/",
        method: "GET",
      });
      if (response.ok) {
        const { topics } = response.data;
        const topicsWithSelectedProperty = topics?.map((t: any) => ({
          ...t,
          selected: false,
        }));
        setState({
          ...state,
          topics: topicsWithSelectedProperty,
          receivedInitResponse: true,
        });
      }
    })();
  }, []);

  const pressInterest = (id: string) => {
    const { topics } = state;
    topics.forEach((i) => {
      if (i.id === id) i.selected = !i.selected;
    });
    setState({ ...state, topics });
  };

  const sendTopics = async () => {
    const { topics } = state;
    const selectedTopics = topics.filter((t) => t.selected);
    if (selectedTopics.length === 0)
      return showBanner({
        message: "Please select at least one interest.",
        type: "warning",
      });
    setState((prevState) => ({ ...prevState, postRequestLoading: true }));
    const response = await request({
      url: "/user/topics/",
      method: "POST",
      body: { topics },
    });
    setState((prevState) => ({ ...prevState, postRequestLoading: false }));
    if (response.ok) {
      global.setState({ onboardingStep: 0 });
      await writeCache("onboardingStep", 0);
      amplitudeTrack(
        AMPLITUDE_LIFETIME_EVENTS.onboarding_completed_select_interests,
        { onboardingStep: 2 }
      );
      amplitudeTrack(AMPLITUDE_LIFETIME_EVENTS.onboarding_completed_all);
    }
  };

  const { topics } = state;
  return (
    <ParentView>
      <Text w="semiBold" s="subHeader">
        Select your interests!
      </Text>
      <Text style={{ marginTop: 20 }}>
        This will help us connect you to people who have similar topics.
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 40 }}>
        {topics.map((i, index) => (
          <HighlightSelect
            selected={i.selected}
            title={i.name}
            id={i.id}
            key={index}
            onPress={(id: string) => pressInterest(id)}
          />
        ))}
      </View>
      {hasSelectedInterests && (
        <Button
          style={{ marginTop: 40 }}
          title="Continue"
          onPress={sendTopics}
          loading={state.postRequestLoading}
        />
      )}
    </ParentView>
  );
};

export default SelectTopics;
