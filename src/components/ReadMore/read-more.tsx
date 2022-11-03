import React from "react";

import "./read-more.css";

export type ReadMoreProps = {
    initiallyOpen: boolean;
    minHeight: number;
};

export const ReadMore: React.FC<ReadMoreProps> = props => {
    const [open, setOpen] = React.useState<boolean>(props.initiallyOpen);
    const [use, setUse] = React.useState<boolean>(false);
    const contentRef = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
        if (
            contentRef.current &&
            contentRef.current.getBoundingClientRect().height > props.minHeight
        ) {
            setUse(true);
        }
    }, [contentRef, props.minHeight]);

    return (
        <div className="ReadMore" ref={contentRef}>
            {use ? (
                <>
                    <div
                        className={open ? "" : "ReadMore__Content"}
                        style={{height: open ? "auto" : props.minHeight}}
                    >
                        {props.children}
                    </div>
                    <div
                        className="ReadMore__Button"
                        onClick={() => setOpen(!open)}
                    >
                        {open ? "Show less" : "Show more"}
                    </div>
                </>
            ) : (
                props.children
            )}
        </div>
    );
};
