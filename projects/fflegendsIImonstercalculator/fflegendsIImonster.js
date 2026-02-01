$(document).ready(function () {

    //Initializers
    var monsterDataObjectArray = loadMonsterData();
    var monsterStatObjectArray = loadMonsterStats();
    loadMonsterFamily();
    loadMonsterSpecies(0, "monster-species-start");
    loadMonsterSpecies(0, "monster-species-dropped");
    displayMonsterStats(monsterStatObjectArray[0], "start");
    displayMonsterStats(monsterStatObjectArray[0], "dropped");
    displayNewMonster();
    displayInitialMonsterCheckbox(0);

    //Events
    $("#monster-family-start").change(function (event) {
        loadMonsterSpecies(event.target.selectedIndex, "monster-species-start");
        displayInitialMonsterCheckbox();
        var monsterStats = determineMonsterStatsToFind();
        displayMonsterStats(monsterStats, "start");
        displayNewMonster();
    });

    $("#monster-species-start").change(function (event) {
        var monsterStats = findMonsterStatsByName(monsterDataObjectArray[$("#monster-family-start").val()].monsterSpecies[event.target.selectedIndex]);
        displayInitialMonsterCheckbox();
        displayMonsterStats(monsterStats, "start");

        displayNewMonster();
    });

    $("#initial-monster-cb").change(function (event) {
        var monsterStats = determineMonsterStatsToFind();
        displayMonsterStats(monsterStats, "start");
        displayNewMonster();
    });

    $("#monster-family-dropped").change(function (event) {
        loadMonsterSpecies(event.target.selectedIndex, "monster-species-dropped");
        var monsterStats = findMonsterStatsByName(monsterDataObjectArray[event.target.selectedIndex].monsterFamily);
        displayMonsterStats(monsterStats, "dropped");
        displayNewMonster();
    });

    $("#monster-species-dropped").change(function (event) {
        var monsterStats = findMonsterStatsByName(monsterDataObjectArray[$("#monster-family-dropped").prop("selectedIndex")].monsterSpecies[event.target.selectedIndex]);
        displayMonsterStats(monsterStats, "dropped");
        displayNewMonster();
    });

    //Load functions
    function loadMonsterData() {
        var monsterDataArray = monsterDataText.split("\n"); //split into rows
        return monsterDataArray.map(row => {
            splitRow = row.split(','); //split row into individual data points
            return {
                monsterIndex: parseInt(splitRow[0]),
                monsterCategory: splitRow[1],
                monsterFamily: splitRow[2],
                modifier: parseInt(splitRow[3]),
                monsterSpecies: [splitRow[2]].concat(splitRow.slice(4, splitRow.length - 1)),
                currentSpeciesIndex: 0,
                monsterSpeciesLevels: splitRow[splitRow.length - 1].split(""),
                currentSpeciesLevel: 0
            };
        });
    }

    function loadMonsterStats() {
        var monsterStatArray = monsterStatText.split("\n"); //split into rows
        return monsterStatArray.map(row => {
            splitRow = row.split(',');
            return {
                monsterName: splitRow[0],
                hp: parseInt(splitRow[2]),
                str: parseInt(splitRow[3]),
                agi: parseInt(splitRow[4]),
                man: parseInt(splitRow[5]),
                def: parseInt(splitRow[6]),
                monsterAbilitiesText: splitRow.slice(7).join(", ")  //slice the remaining elements in the array, then merge them together in a single text string
            };
        });
    }

    function loadMonsterFamily() {
        $.each(monsterDataObjectArray, function (index, monster) {
            //there are 36 monster families you can be, there are 4 additional monsters in the data we need to ignore for starter
            if (index < 36) {
                $("select[id=monster-family-start").append(new Option(monster.monsterFamily, monster.monsterIndex));
            }
            $("select[id=monster-family-dropped").append(new Option(monster.monsterFamily, monster.monsterIndex));
        });
    }

    function loadMonsterSpecies(monsterDataIndex, selectId) {
        $(`#${selectId}`).empty();
        $.each(monsterDataObjectArray[monsterDataIndex].monsterSpecies, function (index, species) {
            //special rule for TianLung, there is no additional species for it so we don't want a blank entry in the dropdown
            if (species != "") {
                $(`#${selectId}`).append(new Option(species, index));
            }
        })
    }

    //Display functions
    function displayInitialMonsterCheckbox() {
        var monsterFamilyIndex = $("#monster-family-start").get(0).selectedIndex;
        var monsterSpeciesIndex = $("#monster-species-start").get(0).selectedIndex;
        //6 = Slime, 20 = Baby-D, 31 = Imp only show initial monster checkbox for them
        if ((monsterFamilyIndex === 6 || monsterFamilyIndex === 20 || monsterFamilyIndex === 31) && monsterSpeciesIndex == 0) {
            $("#initial-monster").show();
        } else {
            //hide and reset the checkbox if not an initial monster
            $("#initial-monster").hide();
            $("#initial-monster-cb").prop("checked", false);
        }
    }

    function displayNewMonster() {
        var newMonster = calculateResultingMonster();
        $("#monster-family-result").text(newMonster.monsterFamily);
        $("#monster-result").text(newMonster.monsterSpecies[newMonster.currentSpeciesIndex]);

        var newMonsterStats = findMonsterStatsByName(newMonster.monsterSpecies[newMonster.currentSpeciesIndex]);
        displayMonsterStats(newMonsterStats, "result");
    }

    function displayMonsterStats(monsterData, element) {
        $(`#monster-stats-${element}-name`).text(monsterData.monsterName);
        $(`#monster-stats-${element}-hp`).text(monsterData.hp);
        $(`#monster-stats-${element}-str`).text(monsterData.str);
        $(`#monster-stats-${element}-agi`).text(monsterData.agi);
        $(`#monster-stats-${element}-man`).text(monsterData.man);
        $(`#monster-stats-${element}-def`).text(monsterData.def);
        $(`#monster-stats-${element}-abilities`).text(monsterData.monsterAbilitiesText);
    }

    //Utilities
    function isInitialMonster() {
        return $("#initial-monster-cb").is(":checked");
    }

    function findMonsterStatsByName(monsterName) {
        var monster = monsterStatObjectArray.find(monsterStats => {
            return monsterStats.monsterName === monsterName;
        });

        return monster;
    }

    function calculateResultingMonster() {
        //create a starting monster from the starting monster dropdowns
        var startingMonster = monsterDataObjectArray[$("#monster-family-start").val()];
        startingMonster.currentSpeciesIndex = $("#monster-species-start").val();
        startingMonster.currentSpeciesLevel = parseInt(startingMonster.monsterSpeciesLevels[startingMonster.currentSpeciesIndex], 16);

        //create a dropped monster from the dropped monster dropdown
        //we have to create a new array because if we have a starting monster that is a high level and we eat a monster of the same type
        //we run into a reference editting problem and this creates a new array that does not have the same references
        var droppedMonsterArray = JSON.parse(JSON.stringify(monsterDataObjectArray));

        var droppedMonster = droppedMonsterArray[$("#monster-family-dropped").val()];
        //if the selected monster is outside the main 36 monster families, inject the special monsters levels into the dropped monster object
        if ($("#monster-family-dropped").prop('selectedIndex') > 35) {
            droppedMonster.monsterSpeciesLevels = droppedMonsterArray[$("#monster-family-dropped").prop('selectedIndex')].monsterSpeciesLevels
        }
        droppedMonster.currentSpeciesIndex = $("#monster-species-dropped").val();
        droppedMonster.currentSpeciesLevel = parseInt(droppedMonster.monsterSpeciesLevels[droppedMonster.currentSpeciesIndex], 16);

        //determine new monster
        return determineNewMonster(startingMonster, droppedMonster);
    }

    function determineNewMonster(startingMonster, droppedMonster) {
        var categoryModifier = determineCategoryModifier(startingMonster, droppedMonster);

        var newMonster = determineNewMonsterFamily(startingMonster, droppedMonster, categoryModifier);

        //starter monsters have a species level of 1
        if (isInitialMonster()) {
            startingMonster.currentSpeciesLevel = 1;
        }

        newMonster.currentSpeciesIndex = parseInt(determineNewMonsterSpeciesIndex(startingMonster, droppedMonster, newMonster), 16);

        return newMonster;
    }

    function determineCategoryModifier(startingMonster, droppedMonster) {
        if ((startingMonster.monsterCategory == "A" || startingMonster.monsterCategory == "B")
            && droppedMonster.monsterCategory == "C") {
            return 1;
        }

        if ((startingMonster.monsterCategory == "B" || startingMonster.monsterCategory == "C")
            && droppedMonster.monsterCategory == "A") {
            return -1;
        }

        return 0;
    }

    function determineNewMonsterFamily(startingMonster, droppedMonster, categoryModifier) {
        var newMonsterIndex = startingMonster.monsterIndex + droppedMonster.modifier + categoryModifier;
        if (newMonsterIndex > 35) {
            //should only ever loop once, adjust for index starting at 0
            newMonsterIndex = newMonsterIndex % 35 - 1;
        }

        return monsterDataObjectArray[newMonsterIndex];
    }

    //uses the highest monster species level to then determine what level in the new species it will transform to
    function determineNewMonsterSpeciesIndex(startingMonster, droppedMonster, newMonster) {
        var maxSpeciesLevel = Math.max(startingMonster.currentSpeciesLevel, droppedMonster.currentSpeciesLevel);
        var speciesIndex = newMonster.monsterSpeciesLevels.length - 1;
        while (maxSpeciesLevel < parseInt(newMonster.monsterSpeciesLevels[speciesIndex], 16) && speciesIndex != 0) {
            speciesIndex--;
        }

        return speciesIndex;
    }

    function determineMonsterStatsToFind() {
        if (isInitialMonster()) {
            if ($("#monster-family-start").get(0).selectedIndex === 31) {
                return findMonsterStatsByName("Imp");
            } else {
                return findMonsterStatsByName(monsterDataObjectArray[$("#monster-family-start").val()].monsterFamily + "-i");
            }
        }
        else {
            return findMonsterStatsByName(monsterDataObjectArray[$("#monster-family-start").val()].monsterFamily);
        }
    }

});