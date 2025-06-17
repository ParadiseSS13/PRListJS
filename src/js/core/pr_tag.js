import React from 'react';
import { API } from './api';
import Select from 'react-select';
import * as VotingGroup from './VotingGroup';

export const PrTag = ({ prtype, prnum }) => {
    const isReadOnly = API.rights.indexOf("Special") === -1;

    let all_types = [
        { value: VotingGroup.BALANCE, color: "#e8d639", backgroundColor: "#2b2611", hotkey: "b" },
        { value: VotingGroup.DESIGN, color: "#6abe39", backgroundColor: "#162312", hotkey: "d" },
        { value: VotingGroup.SPRITE, color: "#e0529c", backgroundColor: "#291321", hotkey: "s" },
        { value: VotingGroup.MAP, color: "lightblue", backgroundColor: "#00c0ff42", hotkey: "m" },
        { value: VotingGroup.TECHNICAL, color: "#e87040", backgroundColor: "#2b1611", hotkey: "t" },
        { value: VotingGroup.HEADCODER, color: "darkred", backgroundColor: "#231414", hotkey: "h" }  
    ];

    // Save the actual stored groups so we can compare them later
    const [storedVotingGroups, setStoredVotingGroups] = React.useState(all_types.filter(type => prtype.includes(type.value)));
    // Keep track of which options are selected so we can store them on menu close
    const [selectedOptions, setSelectedOptions] = React.useState(storedVotingGroups);
    // Keep track if the menu is open or not so we can handle removing elements without opening the menu
    const [menuIsOpen, setMenuIsOpen] = React.useState(false);

    // Only save on menu close to avoid API overload and filter issues
    const changeMenuIsOpen = async (value) => {
        if (value === menuIsOpen) {
            return;
        }
        if (value === false) {
            await storeNewVotingGroups(selectedOptions);
        }
        setMenuIsOpen(value);
    }

    const handleHotkeys = async (e) => {
        if (isReadOnly) {
            return;
        }
        // Ensure these just close the menu instead of select the first option
        if (e.key === "Enter" || e.key === "Tab") {
            changeMenuIsOpen(false);
            e.preventDefault();
            e.stopPropagation();
            return;
        }

        const pressedTypes = all_types.filter(type => type.hotkey === e.key);
        const pressedType = pressedTypes.length ? pressedTypes[0] : null;
        if (!pressedType) {
            return;
        }
        const index = selectedOptions.findIndex(option => option.value === pressedType.value);
        const newOptions = selectedOptions.slice(); // Not mutating the selectedOptions var otherwise the binding breaks with React
        if (index === -1) {
            newOptions.push(pressedType);
        } else {
            newOptions.splice(index, 1);
        }
        setSelectedOptions(newOptions);
    }

    /**
     * Will store the new voting groups if they are different from the existing ones
     * @param {*} newVotingGroupOptions The new voting group options to store
     */
    const storeNewVotingGroups = async (newVotingGroupOptions) => {
        const newVotingGroups = newVotingGroupOptions.map(option => option.value);
        if (newVotingGroupOptions.length === storedVotingGroups.length &&
            newVotingGroupOptions.every(newType => storedVotingGroups.some(initialType => initialType.value === newType.value))) {
            console.log("No new voting groups to set for " + prnum);
            return;
        }
        console.log("Setting voting groups " + newVotingGroups + " for " + prnum);
        setStoredVotingGroups(newVotingGroups);
        await API.setNewPrTypes(prnum, newVotingGroups);
    }

    // Set the selected items in the state and if the menu is closed also save them
    const changeSelectedPrTypes = async (newSelectedOptions, meta) => {
        setSelectedOptions(newSelectedOptions);
        if (!menuIsOpen) {
            await storeNewVotingGroups(newSelectedOptions);
        }
    }

    const styles = {
        // The multi select itself
        control: (styles) => ({ ...styles, backgroundColor: '#141414', borderColor: '#434343' }),
        // The options to pick from
        option: (styles, { data }) => {
            return {
                ...styles,
                color: data.color,
                backgroundColor: data.backgroundColor
            }

        },
        // The values selected
        multiValue: (styles, { data }) => {
            return {
                ...styles,
                color: data.color,
                backgroundColor: data.backgroundColor,
            }
        },
        // Also the values selected, but another part of the chip
        multiValueLabel: (styles, { data }) => {
            return {
                ...styles,
                color: data.color
            }
        },
        // The container around the pickable options
        menu: (styles) => ({ ...styles, backgroundColor: '#141414' }),
        dropdownIndicator: (styles) => ({ ...styles, width: "1.75rem" })

    }

    const optionsFormat = (option, { context }) => context === "value" ? option.value.slice(0, 1) : option.value;

    // https://react-select.com/home
    return (
        <Select
            closeMenuOnSelect={false} // Fucking annoying
            value={selectedOptions}
            isMulti
            onMenuOpen={() => changeMenuIsOpen(true)}
            menuIsOpen={menuIsOpen}
            options={all_types}
            isSearchable={false}
            isClearable={false} // Clears all at once. Not really a thing we want
            backspaceRemovesValue={false}
            styles={styles}
            formatOptionLabel={optionsFormat} // Only show 1 char for selected values. Else show whole value
            placeholder={"UNSET"}
            components={{ IndicatorSeparator: () => null }} // Only takes up space
            onChange={changeSelectedPrTypes}
            onMenuClose={() => changeMenuIsOpen(false)}
            onKeyDown={handleHotkeys}
            isDisabled={isReadOnly}
        />
    )
}
