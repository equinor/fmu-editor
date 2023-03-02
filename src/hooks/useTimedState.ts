import React from "react";

export const useTimedState = <T>(initialValue: T, timeout: number): [T, (value: T, reset?: boolean) => void] => {
    const [value, setValue] = React.useState<T>(initialValue);
    const timeoutRef = React.useRef<NodeJS.Timeout>();

    const setTimedValue = React.useCallback(
        (newValue: T, reset: boolean = true) => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            setValue(newValue);
            if (reset) {
                timeoutRef.current = setTimeout(() => setValue(initialValue), timeout);
            }
        },
        [initialValue, timeout]
    );

    return [value, setTimedValue];
};
