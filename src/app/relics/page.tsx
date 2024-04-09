"use client"
import * as React from 'react';
import Container from '@mui/material/Container';
import { DataGrid, GridRowsProp, GridColDef, GridRowProps } from '@mui/x-data-grid';

async function fetchTierList() {
    const res = await fetch("/api/prydwen/tierlist")
    if (!res.ok) {
        throw new Error('Failed to fetch tierlist')
    }
    return res.json();
}

async function fetchCharacter(slug: string) {
    const res = await fetch(`/api/prydwen/characters/${slug}`)
    if (!res.ok) {
        throw new Error(`Failed to fetch character ${slug}`)
    }
    return res.json();
}

async function compileRelics() {
    const tierList = await fetchTierList();
    const slugs: Array<string> = []
    for (const char of tierList) {
        slugs.push(char.slug);
    }

    const characters: Array<any> = [];
    for (const slug of slugs) {
        characters.push(await fetchCharacter(slug))
    }

    const buildData: Array<any> = [];
    const charCones: Array<any> = [];
    for (const character of characters) {
        if (character.buildData !== null) {
            for (const buildDatum of character.buildData) {
                buildDatum.slug = character.slug;
                buildData.push(buildDatum);
            }
        }
        if (character.conesNew !== null) {
            charCones.push({
                slug: character.slug,
                conesNew: character.conesNew
            })
        }
    }

    interface SetCounts {
        [name: string]: {
            [mainStat: string]: number
        }
    }
    interface RelicCounts {
        [index: string]: any,
        body: SetCounts,
        feet: SetCounts,
        rope: SetCounts,
        sphere: SetCounts,
        characters: {
            relics: SetCounts,
            planars: SetCounts
        },
        cones: SetCounts,
        conesNew: SetCounts,
    }
    const relicCounts: RelicCounts = {
        body: {},
        feet: {},
        rope: {},
        sphere: {},
        characters: {
            relics: {},
            planars: {}
        },
        cones: {},
        conesNew: {},
    }
    for (const buildDatum of buildData) {
        for (const relic of buildDatum.relics) {
            const sets = [relic.relic];
            let countIncrement = 1;
            if (relic.relic_2 !== "") {
                sets.push(relic.relic_2)
                countIncrement = 0.5;
            }
            for (const set of sets) {
                for (const part of ["body", "feet"]) {
                    for (const bodyStat of buildDatum[part]) {
                        const partCount = relicCounts[part];
                        partCount[set] ??= {};
                        const setCount = partCount[set];
                        setCount[bodyStat.stat] ??= 0;
                        setCount[bodyStat.stat] += countIncrement;
                    }
                }
                relicCounts.characters.relics[set] ??= {};
                relicCounts.characters.relics[set][buildDatum.slug] ??= 0;
                relicCounts.characters.relics[set][buildDatum.slug] += countIncrement;
            }
        }
        for (const planar of buildDatum.planars) {
            const set = planar.planar;
            let countIncrement = 1;
            for (const part of ["rope", "sphere"]) {
                for (const bodyStat of buildDatum[part]) {
                    const partCount = relicCounts[part];
                    partCount[set] ??= {};
                    const setCount = partCount[set];
                    setCount[bodyStat.stat] ??= 0;
                    setCount[bodyStat.stat] += countIncrement;
                }
            }
            relicCounts.characters.planars[set] ??= {};
            relicCounts.characters.planars[set][buildDatum.slug] ??= 0;
            relicCounts.characters.planars[set][buildDatum.slug] += countIncrement;
        }
        let ranking = 1;
        for (const cone of buildDatum.cones) {
            const name = cone.cone;
            relicCounts.cones[name] ??= {};
            relicCounts.cones[name][buildDatum.slug] ??= ranking;
            ranking++;
        }
    }

    for (const charCone of charCones) {
        let ranking = 1;
        for (const cone of charCone.conesNew) {
            relicCounts.conesNew[cone.cone] ??= {};
            relicCounts.conesNew[cone.cone][charCone.slug] ??= ranking;
            ranking++;
        }
    }

    return relicCounts;

}

const bodyStatsAll = ["CRIT Rate",
    "CRIT DMG",
    "HP%",
    "DEF%",
    "Effect Hit Rate",
    "ATK%",
    "Outgoing Healing"].sort();

const feetStatsAll = ["ATK%",
    "Speed",
    "HP%",
    "DEF%"].sort();

const sphereStatsAll = ["ATK%",
    "HP%",
    "DEF%",
    "Physical DMG",
    "Lightning DMG",
    "Wind DMG",
    "Imaginary DMG",
    "Ice DMG",
    "Fire DMG",
    "Quantum DMG"].sort();

const nonElementalStatsAll = ["ATK%",
    "HP%",
    "DEF%"].sort();

const elementalStatsAll = ["Physical DMG",
    "Lightning DMG",
    "Wind DMG",
    "Imaginary DMG",
    "Ice DMG",
    "Fire DMG",
    "Quantum DMG"].sort();

const ropeStatsAll = ["Energy Regen Rate",
    "Break Effect",
    "ATK%",
    "DEF%",
    "HP%"].sort();

function notInArray(check: string[], notIn: string[]) {
    const output: string[] = [];
    let bFound = false;
    for (const testString of notIn) {
        bFound = false;
        for (const compareString of check) {
            if (testString === compareString) {
                bFound = true;
                break;
            }
        }
        if (!bFound) {
            output.push(testString)
        }
    }
    return output;
}

export default function Page() {
    const [reloaded, setReloaded] = React.useState(false);
    const [relicCounts, setRelicCounts] = React.useState({});

    React.useEffect(() => {
        compileRelics()
            .then((newRelicCounts) => {
                setRelicCounts(newRelicCounts)
            })
            .catch(console.error);
    }, [reloaded])

    const rows: GridRowsProp = [];
    const planarRows: GridRowsProp = [];

    if (relicCounts.body !== undefined) {
        const setNames = new Set(Object.keys(relicCounts.body))
        for (const setName of Object.keys(relicCounts.feet)) {
            setNames.add(setName);
        }

        let id = 1;
        for (const setName of setNames) {
            const bodyStats = Object.keys(relicCounts.body[setName]);
            const notBodyStats = notInArray(bodyStats, bodyStatsAll);
            const feetStats = Object.keys(relicCounts.feet[setName]);
            const notFeetStats = notInArray(feetStats, feetStatsAll);
            rows.push({ id: id, set: setName, body: notBodyStats.sort(), feet: notFeetStats.sort() })
            id++;
        }

        const planarSetNames = new Set(Object.keys(relicCounts.sphere))
        for (const setName of Object.keys(relicCounts.rope)) {
            planarSetNames.add(setName);
        }

        id = 1;
        for (const setName of planarSetNames) {
            const sphereStats = Object.keys(relicCounts.sphere[setName]);
            const noElementSphereStats = notInArray(sphereStats, nonElementalStatsAll);
            if (!sphereStats.some((value) => elementalStatsAll.includes(value))) {
                noElementSphereStats.push("Elemental DMG")
            }

            const ropeStats = Object.keys(relicCounts.rope[setName]);
            const notRopeStats = notInArray(ropeStats, ropeStatsAll);

            planarRows.push({ id: id, set: setName, sphere: noElementSphereStats.sort(), rope: notRopeStats.sort() })
            id++;
        }

    }

    const columns: GridColDef[] = [
        { field: 'set', headerName: 'Set', flex: 1 },
        { field: 'body', headerName: 'Body', flex: 1 },
        { field: 'feet', headerName: 'Feet', flex: 1 },
    ];

    const planarColumns: GridColDef[] = [
        { field: 'set', headerName: 'Set', flex: 1 },
        { field: 'sphere', headerName: 'Sphere', flex: 1 },
        { field: 'rope', headerName: 'Rope', flex: 1 },
    ];

    return (
        <React.Fragment>
            <Container maxWidth="lg">
                <DataGrid rows={rows} columns={columns} />
            </Container>
            <Container maxWidth="lg">
                <DataGrid rows={planarRows} columns={planarColumns} />
            </Container>
            <pre>{JSON.stringify(relicCounts, null, "\t")}</pre>
        </React.Fragment>
    );
}