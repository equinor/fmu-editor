import {MgtTemplateProps, Person} from "@microsoft/mgt-react";

import React from "react";

export type AvatarProps = {
    user: string;
};

const AvatarTemplate = (props: MgtTemplateProps) => {
    console.log(props.dataContext);
    const {person} = props.dataContext;
    return <img src={person.image} />;
};

export const Avatar: React.FC<AvatarProps> = props => {
    return (
        <Person personQuery={props.user}>
            <AvatarTemplate />
        </Person>
    );
};
