import React from "react";
import {TypedUseSelectorHook, useDispatch, useSelector} from "react-redux";

import _ from "lodash";

import type {AppDispatch, RootState} from "./store";
import store from "./store";

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export function useStrictAppSelector<Selected = unknown>(selector: (state: RootState) => Selected): Selected {
    const selectedStateRef = React.useRef<Selected>(selector(store.getState()));
    const selectorRef = React.useRef<(state: RootState) => Selected>(selector);

    React.useEffect(() => {
        selectorRef.current = selector;
    }, [selector]);

    React.useEffect(() => {
        const checkForUpdates = () => {
            const newState = selectorRef.current(store.getState());
            if (_.isEqual(newState, selectedStateRef.current)) return;
            selectedStateRef.current = selectorRef.current(store.getState());
        };

        const unsubscribeFunc = store.subscribe(checkForUpdates);

        return unsubscribeFunc;
    }, []);

    return selectedStateRef.current;
}
