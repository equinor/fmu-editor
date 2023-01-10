import React from "react";

import {v4} from "uuid";

import "./context-menu.css";

export type ContextMenuTemplate =
    | (
          | {
                label: string;
                shortcut?: string;
                click: () => void;
                icon?: React.ReactNode;
                divider?: boolean;
            }
          | {
                label?: undefined;
                shortcut?: undefined;
                click?: undefined;
                icon?: undefined;
                divider: boolean;
            }
      )[];

export type ContextMenuProps = {
    template: ContextMenuTemplate;
    parent: HTMLElement;
};

export const ContextMenu: React.VFC<ContextMenuProps> = props => {
    const [visible, setVisible] = React.useState(false);
    const [position, setPosition] = React.useState({x: 0, y: 0});

    const overlayRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setPosition({x: e.clientX, y: e.clientY});
            setVisible(true);
        };

        const handleAwayClick = (e: MouseEvent) => {
            if (e.target === overlayRef.current) {
                setVisible(false);
            }
        };

        if (props.parent) {
            props.parent.addEventListener("contextmenu", handleContextMenu);
        }

        const overlay = overlayRef.current;

        if (overlay) {
            overlay.addEventListener("mousedown", handleAwayClick);
        }

        return () => {
            if (props.parent) {
                props.parent.removeEventListener("contextmenu", handleContextMenu);
            }
            if (overlay) {
                overlay.removeEventListener("mousedown", handleAwayClick);
            }
        };
    }, [props.template, props.parent, visible]);

    if (!visible) {
        return null;
    }

    const handleItemClick = (e: React.MouseEvent, func: () => void) => {
        e.stopPropagation();
        func();
        setVisible(false);
    };

    return (
        <div className="ContextMenuOverlay" ref={overlayRef}>
            <div className="ContextMenu" style={{left: position.x, top: position.y}}>
                {props.template.map(item =>
                    item.divider ? (
                        <div key={v4()} className="ContextMenuDivider" />
                    ) : (
                        <div key={item.label} className="ContextMenuItem" onClick={e => handleItemClick(e, item.click)}>
                            {item.icon} {item.label}
                        </div>
                    )
                )}
            </div>
        </div>
    );
};
