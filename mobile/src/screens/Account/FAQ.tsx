import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Icon, ParentView, Text } from "../../components";
import React, { useContext, useEffect, useState } from "react";

import { AccountStackNavProps } from "../../navigation";
import { ThemeContext } from "../../contexts";
import { faqHero } from "../../assets/images";
import { sortBy } from "lodash";
import { useLoadingRequest } from "../../hooks";

interface Props extends AccountStackNavProps<"FAQ"> {
  faqs: FAQObject[];
}

type FAQObject = { question: string; answer: string; id: string };

interface State {
  faqs: FAQObject[];
}

const initialState: State = {
  faqs: [],
};

const FAQ = (props: Props) => {
  const [request, loading] = useLoadingRequest();
  const [state, setState] = useState(initialState);

  useEffect(() => {
    (async () => {
      const response = await request({ url: "/faq", method: "GET" });
      if (response.ok) {
        const sortedFaqs = sortBy(response.data.faq, ["id"]);
        setState({ ...state, faqs: sortedFaqs });
      }
    })();
  }, []);

  return (
    <ParentView noHorizontalPadding noScroll safeBottomInset>
      {loading ? (
        <ActivityIndicator size="small" style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          ListHeaderComponent={
            <Image
              style={{
                width: 300,
                height: 200,
                resizeMode: "contain",
                alignSelf: "center",
              }}
              source={faqHero}
            />
          }
          style={{ marginTop: 20, flex: 1 }}
          data={state.faqs}
          initialNumToRender={1}
          maxToRenderPerBatch={5}
          renderItem={({ item: { question, answer } }) => (
            <SingleFAQ question={question} answer={answer} />
          )}
          keyExtractor={(item, index) => index.toString()}
        />
      )}
    </ParentView>
  );
};

const SingleFAQ = (props: { question: string; answer: string }) => {
  const { backgroundColor, borderColor } = useContext(ThemeContext);
  const [isExpanded, setIsExpanded] = useState(false);

  const styles = StyleSheet.create({
    container: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      marginHorizontal: 10,
      marginVertical: 10,
      backgroundColor,
      borderRadius: 8,
      borderWidth: 1,
      borderColor,
      padding: 10,
    },
    titleContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 8,
    },
    descriptionText: {
      marginTop: 15,
      marginBottom: 10,
    },
  });

  const parseFaqAnswer = (answer: string) => answer.replace(/ \\n /g, "\n\n");

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => setIsExpanded(!isExpanded)}
      style={styles.container}
    >
      <View style={styles.titleContainer}>
        <Text s="lg" w="bold" t={isExpanded ? "highlight" : "none"}>
          {props.question}
        </Text>
        <Icon
          library="fontAwesome5"
          name={`caret-${isExpanded ? "up" : "down"}`}
          size={20}
          color="gray"
        />
      </View>
      {isExpanded && (
        <View>
          <Text style={styles.descriptionText}>
            {parseFaqAnswer(props.answer)}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default FAQ;
