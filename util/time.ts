import { maybePluralize } from 'junoblocks';
import dayjs from 'dayjs';

export const getDuration = (seconds: number) => {
    if ((seconds / 60 / 60 / 24) > 1) {
        return (seconds / 60 / 60 / 24).toFixed() + ' days';
    }
    else if ((seconds / 60 / 60) > 1) {
        return seconds / 60 / 60 + ' hours';
    }
    else if ((seconds / 60) > 1) {
        return seconds / 60 + ' minutes';
    }

    return seconds + ' seconds';
};
export const getRelativeTime = (seconds: String) => {
    /* parse the actual dates */
    const inPrefix = "In ";
    const date = dayjs(Number(seconds) * 1000);

    const now = dayjs();

    const hoursLeft = date.diff(now, 'hours');

    /* more than a day */
    if (hoursLeft > 24) {
        const daysLeft = date.diff(now, 'days');
        const hoursLeftAfterDays = Math.round(24 * ((hoursLeft / 24) % 1));

        return inPrefix + `${hoursLeftAfterDays >= 0
            ? `${maybePluralize(daysLeft, 'day')} and `
            : ''} ${maybePluralize(hoursLeftAfterDays, 'hour')}`;
    }

    /* less than 24 hours left but not less than an hour */
    if (hoursLeft < 24 && hoursLeft > 1) {
        return inPrefix + maybePluralize(hoursLeft, 'hour');
    }

    const minsLeft = date.diff(now, 'minutes');

    if (minsLeft > 0) {
        /* less than an hour */
        return inPrefix + maybePluralize(minsLeft, 'minute');
    }

    const secondsLeft = date.diff(now, 'seconds');

    if (secondsLeft > 0) {
        return 'less than a minute from now';
    }

    return date.toDate().toLocaleString();

};
