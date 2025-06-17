import React from 'react';
import { Menu, Tag, Dropdown, Button } from 'antd';
import { API } from '../api';
import * as VotingGroup from '../VotingGroup';

export const VoteButton = ({votecat, prnum}) => {
    let valid_entries = [];

    if(API.rights.indexOf("Design") > -1) {
        valid_entries.push("Design");
    };
    if(API.rights.indexOf("Balance") > -1) {
        valid_entries.push("Balance");
    };
    if(API.rights.indexOf("Sprite") > -1) {
        valid_entries.push("Sprite");
    };
    if (API.rights.indexOf("Map") > -1) {
        valid_entries.push("Map");
    };
    if (API.rights.indexOf("Special") > -1) {
        valid_entries.push("Veto");
    }


    if(valid_entries.length == 0) {
        return (<i>N/A</i>)
    }

    const addVote = async (prn, vtype) => {
        console.log("Adding vote of type " + vtype + " for " + prn);
        await API.addVote(prn, vtype, votecat);
    }
    let formatted_items = [];
    valid_entries.map(t => {
        let t_override
        if (t == "Veto") { // Within the dropdown of vote types, check if one is veto
            const pr = API.pr_list.find(pr => pr.num === prnum);
            if (pr && pr.ptype && Array.isArray(pr.ptype) && pr.ptype.includes(VotingGroup.HEADCODER)) { // If the Veto option exists, and the PR has the "Headcoder" category, set this var to later change "Veto" to "Headcoder" on the frontend
                t_override = "Headcoder";
            }
        }
        let o = {
            key: t,
            label: (
                <Button onClick={() => addVote(prnum, t)} type="text">{t_override ?? t}</Button>
            )
        };
        formatted_items.push(o);
    })

    const tagmenu = (
        <Menu items={formatted_items} />
    );

    return (
        <Dropdown overlay={tagmenu} placement="bottom" arrow>
            <Tag color="default">+</Tag>
        </Dropdown>
    )
}
