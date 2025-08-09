import React from 'react';
import { Menu, Tag, Dropdown, Button } from 'antd';
import { API } from '../api';
import * as VotingGroup from '../VotingGroup';

export const VoteButton = ({votecat, prnum}) => {
    let valid_entries = [];

    if(API.rights.indexOf("Design") > -1) {
        valid_entries.push("Design");
    }
    if(API.rights.indexOf("Sprite") > -1) {
        valid_entries.push("Sprite");
    }
    if (API.rights.indexOf("Map") > -1) {
        valid_entries.push("Map");
    }
    if (API.rights.indexOf("Special") > -1) {
        valid_entries.push("Veto");
    }

    if(valid_entries.length === 0) {
        return (<i>N/A</i>);
    }

    const addVote = async (prn, vtype) => {
        console.log("Adding vote of type " + vtype + " for " + prn);
        await API.addVote(prn, vtype, votecat);
    }

    const formatted_items = valid_entries.map(t => {
        let t_override;
        if (t === "Veto") {
            const pr = API.pr_list.find(pr => pr.num === prnum);
            if (pr && pr.ptype && Array.isArray(pr.ptype) && pr.ptype.includes(VotingGroup.HEADCODER)) {
                t_override = "Headcoder";
            }
        }
        return {
            key: t,
            label: (
                <Button onClick={() => addVote(prnum, t)} type="text">
                    {t_override ?? t}
                </Button>
            )
        };
    });

    const tagmenu = (
        <Menu items={formatted_items} />
    );

    return (
        <Dropdown overlay={tagmenu} placement="bottom" arrow>
            <Tag color="default">+</Tag>
        </Dropdown>
    );
}
