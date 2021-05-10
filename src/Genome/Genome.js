import React from "react";
import {withStyles} from "@material-ui/core";
import {
    createViewState,
    createJBrowseTheme,
    JBrowseLinearGenomeView,
    ThemeProvider,
} from '@jbrowse/react-linear-genome-view';
import assembly from './Components/assembly';

const theme = createJBrowseTheme();

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
        const tracks = Genome.tracks;
        const defaultSession = Genome.defaultSession;
        const viewState = createViewState({assembly, location: '10:29,838,737..29,838,819', defaultSession,});
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