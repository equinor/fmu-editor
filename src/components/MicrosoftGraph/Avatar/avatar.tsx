import {findPeople} from "@microsoft/mgt-components/dist/es6/graph/graph.people";
import {getPersonImage} from "@microsoft/mgt-components/src/graph/graph.photos";
import {findUsers} from "@microsoft/mgt-components/src/graph/graph.user";
import {IDynamicPerson, MgtPerson, ProviderState, Providers} from "@microsoft/mgt-react";
import {Avatar as MuiAvatar} from "@mui/material";

import React from "react";

import uniqolor from "uniqolor";

export type AvatarProps = {
    user: string;
    size?: number;
    getDetails?: (user: string, details: IDynamicPerson | null) => void;
    titleFormatter?: (user: string) => string;
};

const cachedData: Record<string, {details: IDynamicPerson; image: string}> = {};

export const Avatar: React.FC<AvatarProps> = props => {
    const defaultSize = 48;

    const [personDetails, setPersonDetails] = React.useState<IDynamicPerson>({});
    const [personImage, setPersonImage] = React.useState<string | null>(null);
    const signedIn = false;

    React.useEffect(() => {
        setPersonDetails({
            displayName: props.user,
            givenName: props.user,
            surname: "",
        });
    }, [props.user]);

    React.useEffect(() => {
        if (props.getDetails) {
            props.getDetails(props.user, personDetails);
        }
    }, [props, personDetails]);

    React.useEffect(() => {
        const loadAvatar = async () => {
            const provider = Providers.globalProvider;
            if (!provider || provider.state === ProviderState.Loading) {
                return;
            }

            if (provider.state === ProviderState.SignedOut) {
                setPersonDetails({
                    displayName: props.user,
                    givenName: props.user,
                    surname: "",
                });
                return;
            }

            if (cachedData[props.user]) {
                setPersonDetails(cachedData[props.user].details);
                setPersonImage(cachedData[props.user].image);
                return;
            }

            const graph = provider.graph;

            let people = await findPeople(graph, props.user, 1);

            if (!people || people.length === 0) {
                people = (await findUsers(graph, props.user, 1)) || [];
            }

            if (people && people.length > 0) {
                setPersonDetails(people[0]);
                const image = await getPersonImage(graph, people[0], MgtPerson.config.useContactApis);

                if (image) {
                    setPersonImage(image);
                }
                cachedData[props.user] = {
                    details: people[0],
                    image,
                };
            }
        };

        loadAvatar();
    }, [props.user]);

    const titleUser = `${personDetails.displayName ?? ""}${
        !signedIn ? " (sign in to load user details and profile pictures)" : ""
    }`;

    return (
        <MuiAvatar
            src={personImage}
            alt={`${personDetails.givenName ?? ""} ${personDetails.surname ?? ""}`}
            title={props.titleFormatter ? props.titleFormatter(titleUser) : titleUser}
            sx={{
                width: props.size || defaultSize,
                height: props.size || defaultSize,
                fontSize: props.size / 2,
                backgroundColor: uniqolor(personDetails.displayName ?? "").color,
            }}
        >
            {personDetails.givenName ? personDetails.givenName[0] : ""}
        </MuiAvatar>
    );
};
