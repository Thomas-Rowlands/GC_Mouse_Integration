import React from "react";
import * as qs from "query-string";
import 'fontsource-roboto';
import {
    createViewState,
    JBrowseLinearGenomeView,
} from '@jbrowse/react-linear-genome-view';
import {api_server} from "../../UtilityComponents/ConfigData";

class GenomeBrowser extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            configData: api_server
        }
    }

    assembly = () => {
        return {
            name: "hg19",
            aliases: ["GRCh37"],
            sequence: {
                type: "ReferenceSequenceTrack",
                trackId: "assembly_track",
                adapter: {
                    type: "BgzipFastaAdapter",
                    fastaLocation: {"uri": this.state.configData.api_server + "JBrowseData/hg19.fa.gz"},
                    faiLocation: {"uri": this.state.configData.api_server + "JBrowseData/hg19.fa.gz.fai"},
                    gziLocation: {"uri": this.state.configData.api_server + "JBrowseData/hg19.fa.gz.gzi"}
                },
                rendering: {type: "DivSequenceRenderer"}
            },
            refNameAliases: {
                adapter: {
                    type: "RefNameAliasAdapter",
                    location: {uri: this.state.configData.api_server + "JBrowseData/hg19_aliases.txt"}
                }
            }
        };
    }

    tracks = () => {
        return [{
            type: "ReferenceSequenceTrack",
            trackId: "refseq_track",
            adapter: {
                type: "BgzipFastaAdapter",
                fastaLocation: {"uri": this.state.configData.api_server + "JBrowseData/hg19.fa.gz"},
                faiLocation: {"uri": this.state.configData.api_server + "JBrowseData/hg19.fa.gz.fai"},
                gziLocation: {"uri": this.state.configData.api_server + "JBrowseData/hg19.fa.gz.gzi"}
            },
            rendering: {type: "DivSequenceRenderer"}
        },];
    }

    defaultSession = () => {
        return {
            name: 'Default Session',
            view: {
                id: 'linearGenomeView',
                type: 'LinearGenomeView',
                tracks: [
                    {
                        type: 'ReferenceSequenceTrack',
                        configuration: 'assembly_track',
                        displays: [
                            {
                                type: 'LinearReferenceSequenceDisplay',
                                configuration:
                                    'refseq_track-LinearReferenceSequenceDisplay',
                            },
                        ],
                    },
                ],
            },
        };
    }

    configuration = () => {
        return {
            theme: {
                palette: {
                    primary: {
                        main: '#311b92',
                    },
                    secondary: {
                        main: '#004ba7',
                    },
                    tertiary: {
                        main: '#f57c00',
                    },
                    quaternary: {
                        main: '#d50000',
                    },
                    bases: {
                        A: {main: '#98FB98'},
                        C: {main: '#87CEEB'},
                        G: {main: '#DAA520'},
                        T: {main: '#DC143C'},
                    },
                },
            },
            disableAnalytics: true,
        };
    };


    render() {
        const assembly = this.assembly();
        const tracks = this.tracks();
        const defaultSession = this.defaultSession();
        const configuration = this.configuration();
        const state = createViewState(
            {
                configuration: configuration,
                assembly,
                tracks,
                defaultSession: defaultSession,
                location: "1:100,987,269..100,987,368"
            }
        );
        return (
            < JBrowseLinearGenomeView viewState={state}/>
        )
    }
}

export default GenomeBrowser;