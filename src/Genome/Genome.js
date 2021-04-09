import React from "react";
import {withStyles} from "@material-ui/core";
import {
    createViewState,
    createJBrowseTheme,
    JBrowseLinearGenomeView,
    ThemeProvider,
} from '@jbrowse/react-linear-genome-view';

const theme = createJBrowseTheme();
const assembly = {
    name: 'GRCh38',
    sequence: {
        type: 'ReferenceSequenceTrack',
        trackId: 'GRCh38-ReferenceSequenceTrack',
        adapter: {
            type: 'BgzipFastaAdapter',
            fastaLocation: {
                uri:
                    "JBrowseData/seq/Homo_sapiens.GRCh38.dna.fa.gz",
            },
            faiLocation: {
                uri:
                    "JBrowseData/seq/Homo_sapiens.GRCh38.dna.fa.gz.fai",
            },
            gziLocation: {
                uri:
                    "JBrowseData/seq/Homo_sapiens.GRCh38.dna.fa.gz.gzi",
            },
        },
    },
    aliases: ['hg38']
}

const tracks = [
    {
        type: 'FeatureTrack',
        trackId: 'gc_variants_hg38',
        name: 'Human Variants',
        assemblyNames: ['GRCh38'],
        category: ['Annotation'],
        adapter: {
            type: 'Gff3TabixAdapter',
            gffGzLocation: {
                uri:
                    'JBrowseData/tracks/tracks.conf',
            },
            index: {
                location: {
                    uri:
                        '',
                },
            },
        },
    },
]

const defaultSession = {
    name: 'My session',
    view: {
        id: 'linearGenomeView',
        type: 'LinearGenomeView',
        tracks: [
            {
                type: 'ReferenceSequenceTrack',
                configuration: 'GRCh38-ReferenceSequenceTrack',
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
}

const useStyles = theme => ({
    formControl: {
        margin: theme.spacing(1),
        minWidth: 120,
    },
    selectEmpty: {
        marginTop: theme.spacing(2),
    },
    autoComplete: {
        width: "50%",
        marginLeft: "auto",
        marginRight: "auto",
    },
    radio: {
        width: "50%",
        marginLeft: "auto",
        marginRight: "auto"
    },
});


class Genome extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            loading: false,
        };

    }

    static get theme() {
        return theme;
    }

    static get defaultSession() {
        return defaultSession;
    }

    static get tracks() {
        return tracks;
    }

    static get assembly() {
        return assembly;
    }

    render() {
        const assembly = Genome.assembly;
        const tracks = Genome.tracks;
        const defaultSession = Genome.defaultSession;
        const viewState = createViewState({assembly, tracks, location: '10:29,838,737..29,838,819', defaultSession,});
        return (
            <div>
                <ThemeProvider theme={Genome.theme}>
                    <JBrowseLinearGenomeView viewState={viewState}/>
                </ThemeProvider>
            </div>
        );
    }
}

export default withStyles(useStyles)(Genome);