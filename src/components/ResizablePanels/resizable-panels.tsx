import useSize from "@react-hook/size";

import React from "react";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {setPaneConfiguration} from "@redux/reducers/ui";

import "./resizable-panels.css";

type ResizablePanelsProps = {
    id: string;
    direction: "horizontal" | "vertical";
    children: React.ReactNode[];
    minSizes?: number[];
    visible?: boolean[];
};

export const ResizablePanels: React.FC<ResizablePanelsProps> = props => {
    if (props.minSizes && props.minSizes.length !== props.children.length) {
        throw new Error("minSizes must have the same length as children");
    }

    if (props.visible && props.visible.length !== props.children.length) {
        throw new Error("visible must have the same length as children");
    }

    const [isDragging, setIsDragging] = React.useState<boolean>();
    const [currentIndex, setCurrentIndex] = React.useState<number>(0);
    const [sizes, setSizes] = React.useState<number[]>(
        useAppSelector(
            state =>
                state.ui.paneConfiguration.find(el => el.name === props.id)?.sizes ||
                Array(props.children.length).fill(1.0 / props.children.length)
        )
    );
    const resizablePanelsRef = React.useRef<HTMLDivElement | null>(null);
    const resizablePanelRefs = React.useRef<(HTMLDivElement | null)[]>([]);

    const [totalWidth, totalHeight] = useSize(resizablePanelsRef);
    const dispatch = useAppDispatch();

    React.useEffect(() => {
        resizablePanelRefs.current = resizablePanelRefs.current.slice(0, props.children.length);
    }, [props.children.length]);

    const startResize = React.useCallback(
        (index: number) => {
            window.addEventListener("selectstart", e => e.preventDefault());
            setCurrentIndex(index);
            setIsDragging(true);
        },
        [setCurrentIndex, setIsDragging]
    );

    React.useEffect(() => {
        let resize: ((e: PointerEvent) => void) | undefined;
        if (props.direction === "horizontal") {
            resize = (event: PointerEvent) => {
                if (!isDragging) {
                    return;
                }
                const totalSize = resizablePanelsRef.current?.getBoundingClientRect().width || 0;
                const firstElement = resizablePanelRefs.current[currentIndex];
                const secondElement = resizablePanelRefs.current[currentIndex + 1];
                if (firstElement && secondElement) {
                    const newSizes = sizes.map((size, index) => {
                        if (index === currentIndex) {
                            const newSize = event.clientX - firstElement.getBoundingClientRect().left;
                            return (newSize / totalSize) * 100;
                        }
                        if (index === currentIndex + 1) {
                            const newSize = secondElement.getBoundingClientRect().right - event.clientX;
                            return (newSize / totalSize) * 100;
                        }
                        return size;
                    }) as number[];
                    setSizes(newSizes);
                }
            };
        } else if (props.direction === "vertical") {
            resize = (event: PointerEvent) => {
                if (!isDragging) {
                    return;
                }
                const totalSize = resizablePanelsRef.current?.getBoundingClientRect().height || 0;
                const firstElement = resizablePanelRefs.current[currentIndex];
                const secondElement = resizablePanelRefs.current[currentIndex + 1];
                if (firstElement && secondElement) {
                    const newSizes = sizes.map((size, index) => {
                        if (index === currentIndex) {
                            const newSize = event.clientY - firstElement.getBoundingClientRect().top;
                            return (newSize / totalSize) * 100;
                        }
                        if (index === currentIndex + 1) {
                            const newSize = secondElement.getBoundingClientRect().bottom - event.clientY;
                            return (newSize / totalSize) * 100;
                        }
                        return size;
                    }) as number[];
                    setSizes(newSizes);
                }
            };
        }

        if (!resize) {
            return;
        }

        const stopResize = () => {
            window.removeEventListener("selectstart", e => e.preventDefault());
            if (isDragging) {
                dispatch(setPaneConfiguration({name: props.id, sizes}));
            }
            setIsDragging(false);
        };
        document.addEventListener("pointermove", resize);
        document.addEventListener("pointerup", stopResize);

        return () => {
            if (resize) {
                document.removeEventListener("pointermove", resize);
            }
            document.removeEventListener("pointerup", stopResize);
        };
    }, [isDragging, setIsDragging, sizes, setSizes, props.direction, currentIndex, props.id, dispatch]);

    const minSizesToggleVisibilityValue = 100 * (props.direction === "horizontal" ? 50 / totalWidth : 50 / totalHeight);

    return (
        <div
            className={`ResizablePanelsWrapper${props.direction === "horizontal" ? "Horizontal" : "Vertical"}`}
            ref={resizablePanelsRef}
        >
            <div
                className={`ResizablePanelsOverlay${props.direction === "horizontal" ? "Horizontal" : "Vertical"}`}
                style={{
                    width: totalWidth,
                    height: totalHeight,
                    display: isDragging ? "block" : "none",
                }}
            />
            {props.children.map((el: React.ReactNode, index: number) => (
                /* eslint-disable react/no-array-index-key */
                <React.Fragment key={`resizable-panel-${index}`}>
                    <div
                        className="ResizablePanel"
                        /* eslint-disable no-return-assign */
                        ref={element => (resizablePanelRefs.current[index] = element)}
                        style={
                            props.direction === "horizontal"
                                ? {
                                      width: `calc(${sizes[index]}% - 3px)`,
                                      minWidth:
                                          props.visible?.at(index) === false
                                              ? 0
                                              : sizes[index] > minSizesToggleVisibilityValue
                                              ? props.minSizes?.at(index) || 0
                                              : 0,
                                      maxWidth:
                                          (sizes[index] < minSizesToggleVisibilityValue && props.minSizes?.at(index)) ||
                                          props.visible?.at(index) === false
                                              ? 0
                                              : undefined,
                                  }
                                : {
                                      height: `calc(${sizes[index]}% - 3px)`,
                                      minHeight:
                                          props.visible?.at(index) === false
                                              ? 0
                                              : sizes[index] > minSizesToggleVisibilityValue
                                              ? props.minSizes?.at(index) || 0
                                              : 0,
                                      maxHeight:
                                          (sizes[index] < minSizesToggleVisibilityValue && props.minSizes?.at(index)) ||
                                          props.visible?.at(index) === false
                                              ? 0
                                              : undefined,
                                  }
                        }
                    >
                        {el}
                    </div>
                    {index < props.children.length - 1 && (
                        <div
                            className={`ResizeDragBar ResizeDragBar${props.direction === "horizontal" ? "Horizontal" : "Vertical"}${
                                isDragging ? " ResizeDragBar--active" : ""
                            }`}
                            onPointerDown={() => startResize(index)}
                        />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};
