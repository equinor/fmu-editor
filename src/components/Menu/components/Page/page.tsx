import {Link} from "@mui/material";

import React from "react";
import {Icon} from "../Icon";

import "./page.css";

type PageProps = {
    active: boolean;
    title: string;
    href: string;
    level: number;
    icon?: string;
    applyIconIndentation: boolean;
    onClick: () => void;
};

export const Page: React.FC<PageProps> = props => {
    return (
        <Link
            underline="none"
            className={`Menu__Page${
                props.active ? " Menu__CurrentPage" : ""
            } Menu__Item`}
            href={props.href}
            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                props.onClick();
                e.preventDefault();
            }}
            style={{paddingLeft: 16 * props.level}}
        >
            {props.icon && (
                <Icon
                    className="Menu__Icon"
                    icon={props.icon}
                    active={props.active}
                />
            )}
            <span
                className={
                    props.icon
                        ? "Icon"
                        : props.applyIconIndentation
                        ? "IconPlaceholder"
                        : ""
                }
            >
                {props.title}
            </span>
        </Link>
    );
};
