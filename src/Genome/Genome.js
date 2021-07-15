import React from "react";
import AppIdeogram from "./Components/AppIdeogram";
import LoadingSpinner from "../UtilityComponents/LoadingSpinner/LoadingSpinner";
import {AppBar, Tab, Tabs} from "@material-ui/core";
import TabPanel from "../UtilityComponents/TabPanel";
import axios from "axios";
import * as qs from 'query-string';
import {withRouter} from "react-router";
import {api_server} from "../UtilityComponents/ConfigData";
import 'fontsource-roboto';
import {
    createViewState,
    JBrowseLinearGenomeView,
} from '@jbrowse/react-linear-genome-view';


class Genome extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            tabValue: 0,
            termID: qs.parse(this.props.location.search).termID,
            ontology: qs.parse(this.props.location.search).ontology,
            markerData: null,
            configData: api_server
        };
    }

    componentDidMount() {
        if (!this.state.markerData && this.state.termID && this.state.ontology)
            this.getHumanMarkerData(this.state.termID, this.state.ontology);
    }

    getHumanMarkerData = (termID, ontology) => {
        let url_string = this.state.configData.api_server + "controller.php?type=genome&phenotype=" + termID + "&ontology=" + ontology;
        axios.get(url_string)
            .then((response) => {
                if (response.status === 200) {
                    if (response.data) {
                        let result = [];
                        response.data.forEach(marker =>
                            result.push({
                                "name": marker.name,
                                "chr": marker.chr,
                                "start": parseInt(marker.start),
                                "stop": parseInt(marker.stop),
                                "pval": parseFloat(marker.pval)
                            })
                        );
                        this.setState({markerData: result, loading: false});
                    }
                }
            }).catch((error) => {
            console.log(error);
        });
    }

    assembly = () => {
        return {
            name: 'GRCh38',
            sequence: {
                type: 'ReferenceSequenceTrack',
                trackId: 'GRCh38-ReferenceSequenceTrack',
                adapter: {
                    type: 'BgzipFastaAdapter',
                    fastaLocation: {uri: 'http://ftp.ensembl.org/pub/release-100/fasta/homo_sapiens/dna_index/Homo_sapiens.GRCh38.dna.toplevel.fa.gz',},
                    faiLocation: {uri: 'http://ftp.ensembl.org/pub/release-100/fasta/homo_sapiens/dna_index/Homo_sapiens.GRCh38.dna.toplevel.fa.gz.fai',},
                    gziLocation: {uri: 'http://ftp.ensembl.org/pub/release-100/fasta/homo_sapiens/dna_index/Homo_sapiens.GRCh38.dna.toplevel.fa.gz.gzi',},
                },
            },
            aliases: ['hg38'],
            refNameAliases: {adapter: {type: 'RefNameAliasAdapter', location: {uri: 'GRCh38.aliases.txt',},},},
        };
    }

    tracks = () => {
        return [{
            type: 'BasicTrack',
            trackId: 'GCA_000001405.15_GRCh38_full_analysis_set.refseq_annotation.sorted.gff',
            name: 'NCBI RefSeq Genes',
            category: ['Genes'],
            assemblyNames: ['GRCh38'],
            adapter: {
                type: 'Gff3TabixAdapter',
                gffGzLocation: {uri: 'https://s3.amazonaws.com/jbrowse.org/genomes/GRCh38/ncbi_refseq/GCA_000001405.15_GRCh38_full_analysis_set.refseq_annotation.sorted.gff.gz',},
                index: {
                    location: {uri: 'https://s3.amazonaws.com/jbrowse.org/genomes/GRCh38/ncbi_refseq/GCA_000001405.15_GRCh38_full_analysis_set.refseq_annotation.sorted.gff.gz.tbi',},
                    indexType: 'TBI',
                },
            },
            renderer: {type: 'SvgFeatureRenderer',},
        }, {
            type: 'AlignmentsTrack',
            trackId: 'NA12878.alt_bwamem_GRCh38DH.20150826.CEU.exome',
            name: 'NA12878 Exome',
            category: ['1000 Genomes', 'Alignments'],
            assemblyNames: ['GRCh38'],
            adapter: {
                type: 'CramAdapter',
                cramLocation: {uri: 'https://s3.amazonaws.com/jbrowse.org/genomes/GRCh38/alignments/NA12878/NA12878.alt_bwamem_GRCh38DH.20150826.CEU.exome.cram',},
                craiLocation: {uri: 'https://s3.amazonaws.com/jbrowse.org/genomes/GRCh38/alignments/NA12878/NA12878.alt_bwamem_GRCh38DH.20150826.CEU.exome.cram.crai',},
                sequenceAdapter: {
                    type: 'BgzipFastaAdapter',
                    fastaLocation: {uri: 'http://ftp.ensembl.org/pub/release-100/fasta/homo_sapiens/dna_index/Homo_sapiens.GRCh38.dna.toplevel.fa.gz',},
                    faiLocation: {uri: 'http://ftp.ensembl.org/pub/release-100/fasta/homo_sapiens/dna_index/Homo_sapiens.GRCh38.dna.toplevel.fa.gz.fai',},
                    gziLocation: {uri: 'http://ftp.ensembl.org/pub/release-100/fasta/homo_sapiens/dna_index/Homo_sapiens.GRCh38.dna.toplevel.fa.gz.gzi',},
                },
            },
        }, {
            type: 'VariantTrack',
            trackId: 'ALL.wgs.shapeit2_integrated_snvindels_v2a.GRCh38.27022019.sites.vcf',
            name: '1000 Genomes Variant Calls',
            category: ['1000 Genomes', 'Variants'],
            assemblyNames: ['GRCh38'],
            adapter: {
                type: 'VcfTabixAdapter',
                vcfGzLocation: {uri: 'https://s3.amazonaws.com/jbrowse.org/genomes/GRCh38/variants/ALL.wgs.shapeit2_integrated_snvindels_v2a.GRCh38.27022019.sites.vcf.gz',},
                index: {
                    location: {uri: 'https://s3.amazonaws.com/jbrowse.org/genomes/GRCh38/variants/ALL.wgs.shapeit2_integrated_snvindels_v2a.GRCh38.27022019.sites.vcf.gz.tbi',},
                    indexType: 'TBI',
                },
            },
        },];
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
        };
    }

    render() {
        let {loading, tabValue, termID, ontology, markerData} = this.state;
        const assembly = this.assembly();
        const tracks = this.tracks();
        const defaultSession = this.defaultSession();
        const viewState = createViewState({
            assembly,
            tracks,
            location: 'ctgA:1105..1221',
        });
        return termID && ontology ?
            (
                <div>
                    <AppBar position="static" color="default">
                        <Tabs
                            value={tabValue}
                            onChange={(e, val) => this.setState({tabValue: val})}
                            indicatorColor="primary"
                            textColor="primary"
                            variant="fullWidth"
                            aria-label="full width tabs example"
                        >
                            <Tab label="Karyotype"/>
                            <Tab label="Browser"/>

                        </Tabs>
                    </AppBar>
                    <TabPanel value={tabValue} index={0} className="subTabMenu">
                        {
                            markerData ? <AppIdeogram markerData={markerData} organism="human"/> :
                                <LoadingSpinner loading={loading}/>
                        }
                    </TabPanel>
                    <TabPanel value={tabValue} index={1} className="subTabMenu">
                        <JBrowseLinearGenomeView viewState={viewState}/>
                    </TabPanel>
                </div>
            ) : null;
    }
}

export default withRouter(Genome);