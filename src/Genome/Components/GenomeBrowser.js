import React from "react";
import * as qs from "query-string";
import {api_server} from "../../UtilityComponents/ConfigData";
import 'fontsource-roboto';
import {
    createViewState,
    JBrowseLinearGenomeView,
} from '@jbrowse/react-linear-genome-view';

class GenomeBrowser extends React.Component {

    export
    default
    GenomeBrowser;

    constructor(props) {
        super(props);
    }

    assembly = () => {
        return {
            name: "hg19",
            aliases: ["GRCh37"],
            sequence: {
                type: "ReferenceSequenceTrack",
                trackId: "refseq_track",
                adapter: {
                    type: "BgzipFastaAdapter",
                    fastaLocation: {uri: "https://jbrowse.org/genomes/hg19/fasta/hg19.fa.gz"},
                    faiLocation: {uri: "https://jbrowse.org/genomes/hg19/fasta/hg19.fa.gz.fai"},
                    gziLocation: {uri: "https://jbrowse.org/genomes/hg19/fasta/hg19.fa.gz.gzi"}
                },
                rendering: {type: "DivSequenceRenderer"}
            },
            refNameAliases: {
                adapter: {
                    type: "RefNameAliasAdapter",
                    location: {uri: "https://s3.amazonaws.com/jbrowse.org/genomes/hg19/hg19_aliases.txt"}
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
                fastaLocation: {"uri": "https://jbrowse.org/genomes/hg19/fasta/hg19.fa.gz"},
                faiLocation: {"uri": "https://jbrowse.org/genomes/hg19/fasta/hg19.fa.gz.fai"},
                gziLocation: {"uri": "https://jbrowse.org/genomes/hg19/fasta/hg19.fa.gz.gzi"}
            },
            rendering: {type: "DivSequenceRenderer"}
        }];
    }

    defaultSession = () => {
        return {
            name: 'My session',
            view: {
                id: 'linearGenomeView',
                type: 'LinearGenomeView',
                tracks: [
                    {
                        type: 'ReferenceSequenceTrack',
                        configuration: 'refseq_track',
                        displays: [
                            {
                                type: 'LinearReferenceSequenceDisplay',
                                configuration:
                                    'GRCh38-ReferenceSequenceTrack-LinearReferenceSequenceDisplay',
                            },
                        ],
                    },
                    {
                        type: 'FeatureTrack',
                        configuration: 'ncbi_refseq_109_hg38',
                        displays: [
                            {
                                type: 'LinearBasicDisplay',
                                configuration: 'ncbi_refseq_109_hg38-LinearBasicDisplay',
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
            }
        );
        return (
            < JBrowseLinearGenomeView viewState={state}/>
        )
    }
}

export default GenomeBrowser;