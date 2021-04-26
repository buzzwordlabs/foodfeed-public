import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import updateLocale from "dayjs/plugin/updateLocale";
import relativeTime from "dayjs/plugin/relativeTime";
import duration from "dayjs/plugin/duration";
import calendar from "dayjs/plugin/calendar";
import numeral from "numeral";

dayjs.extend(localizedFormat);
dayjs.extend(updateLocale);
dayjs.extend(relativeTime);
dayjs.extend(duration);
dayjs.extend(calendar);
dayjs.updateLocale("en", {
  relativeTime: {
    past: "%s",
    s: "%ds",
    m: "%dm",
    mm: "%dm",
    h: "%dh",
    hh: "%dh",
    d: "%dd",
    dd: "%dd",
    M: "%dm",
    MM: "%dm",
    y: "%dy",
    yy: "%dy",
  },
});

export const formatMessageDate = (date: string) => {
  const { now, then } = getNowAndThen(date);
  const { minutes } = calculateDiffs({ now, then });
  if (minutes === 0) return "Just now";
  if (minutes === 1) return "A minute ago";
  if (minutes < 5) return "A few minutes ago";
  if (minutes <= 70 && minutes >= 50) return "An hour ago";
  return then.calendar(undefined, {
    sameDay: "[Today at] h:mm A",
    lastDay: "[Yesterday] h:mm A",
    lastWeek: "dddd h:mm A",
    sameElse: "M/D/YYYY h:mm A",
  });
};

export const numberWithCommas = (number: number) =>
  number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export const truncateThousand = (number: number) =>
  numeral(number).format("0a");

export const formatPGDate = (PGTime: string, formatOverride?: string) => {
  return dayjs(PGTime).format(formatOverride || "lll");
};

export const formatTimeFromNow = (date: string) => {
  return dayjs(date).fromNow(true);
};

export const formatPGDateHumanized = (PGTime: string, timeOnly?: boolean) => {
  const appendAgo = (d: string) => {
    if (d.includes("NaN")) return "";
    return timeOnly ? d : `${d} ago`;
  };
  const diffs = calculateDiffs(getNowAndThen(PGTime));
  if (diffs.days > 1) return dayjs(PGTime).format("LL");
  return appendAgo(humanizeDiffs(diffs));
};

interface SMHD {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const calculateDiffs = ({
  now,
  then,
}: {
  now: dayjs.Dayjs;
  then: dayjs.Dayjs;
}): SMHD => {
  const days = now.diff(then, "d");
  const hours = now.diff(then, "h");
  const minutes = now.diff(then, "m");
  const seconds = now.diff(then, "s");
  return { days, hours, minutes, seconds };
};

export const getNowAndThen = (thenString: string) => {
  const now = dayjs();
  const then = dayjs(thenString);
  return { now, then };
};

export const humanizeDiffs = ({ seconds, minutes, hours, days }: SMHD) => {
  if (!(seconds > 60)) return dayjs.duration(seconds, "s").humanize(false);
  if (!(minutes > 60)) return dayjs.duration(minutes, "m").humanize(false);
  if (!(hours > 24)) return dayjs.duration(hours, "h").humanize(false);
  return dayjs.duration(days, "d").humanize(false);
};

export const formatSecondsDuration = (seconds: number) => {
  return dayjs.duration(seconds, "seconds").humanize(false);
};

export const prettyTimeMS = (seconds: number) => {
  const secs = Math.floor(seconds % 60);
  const hours = Math.floor(seconds / 60 / 60);
  if (hours > 0) {
    const mins = Math.floor(seconds / 60) - hours * 60;
    return {
      mins,
      secs,
      textFormat: `${hours}:${mins < 10 ? `0${mins}` : mins}: ${
        secs < 10 ? `0${secs}` : secs
      } `,
    };
  } else {
    const mins = Math.floor(seconds / 60);
    return {
      mins,
      secs,
      textFormat: `${mins}:${secs < 10 ? `0${secs}` : secs} `,
    };
  }
};
