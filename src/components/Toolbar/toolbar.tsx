import React from "react";

import {Environment} from "./components/environment";
import {FmuDirectory} from "./components/fmu-directory";
import {User} from "./components/user";
import {UserDirectory} from "./components/user-directory";
import {WorkingDirectory} from "./components/working-directory";
import "./toolbar.css";

export const Toolbar: React.FC = () => {
    return (
        <div className="Toolbar">
            <FmuDirectory />
            <WorkingDirectory />
            <User />
            <Environment />
            <UserDirectory />
        </div>
    );
};
