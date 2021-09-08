import React from "react";
import AppIdeogram from "./Components/AppIdeogram";
import LoadingSpinner from "../UtilityComponents/LoadingSpinner/LoadingSpinner";
import {AppBar, Tab, Tabs} from "@material-ui/core";
import TabPanel from "../UtilityComponents/TabPanel";
import axios from "axios";
import * as qs from 'query-string';
import {withRouter} from "react-router";
import {api_server} from "../UtilityComponents/ConfigData";
import GenomeBrowser from "./Components/GenomeBrowser";
import Typography from "@material-ui/core/Typography";


class Genome extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            tabValue: 0,
            termID: props.genotypeTermID ? props.genotypeTermID : qs.parse(this.props.location.search).termID,
            ontology: props.genotypeOntology ? props.genotypeOntology : qs.parse(this.props.location.search).ontology,
            markerData: null,
            configData: api_server,
            annotationSelected: null,
        };
    }

    componentDidMount() {
        if (!this.state.markerData && this.state.termID && this.state.ontology)
            this.getKaryotypeData(this.state.termID, this.state.ontology);
    }

    onAnnotationClick = (annot) => {
        this.setState({annotationSelected: annot, tabValue: 1});
    }


    getKaryotypeData = (termID, ontology) => {
        let url_string = this.state.configData.api_server + "controller.php?type=genome&phenotype=" + termID + "&ontology=" + ontology;
        axios.get(url_string)
            .then((response) => {
                if (response.status === 200) {
                    if (response.data) {
                        let result = {
                                "keys": [
                                    "name",
                                    "start",
                                    "length",
                                    "trackIndex",
                                    "color"
                                ],
                                "annots": [
                                    {
                                        "chr":
                                            "1",
                                        "annots":
                                            []
                                    }
                                    ,
                                    {
                                        "chr":
                                            "2",
                                        "annots":
                                            []
                                    }
                                    ,
                                    {
                                        "chr":
                                            "3",
                                        "annots":
                                            []
                                    }
                                    ,
                                    {
                                        "chr":
                                            "4",
                                        "annots":
                                            []
                                    }
                                    ,
                                    {
                                        "chr":
                                            "5",
                                        "annots":
                                            []
                                    }
                                    ,
                                    {
                                        "chr":
                                            "6",
                                        "annots":
                                            []
                                    }
                                    ,
                                    {
                                        "chr":
                                            "7",
                                        "annots":
                                            []
                                    }
                                    ,
                                    {
                                        "chr":
                                            "8",
                                        "annots":
                                            []
                                    }
                                    ,
                                    {
                                        "chr":
                                            "9",
                                        "annots":
                                            []
                                    }
                                    ,
                                    {
                                        "chr":
                                            "10",
                                        "annots":
                                            []
                                    }
                                    ,
                                    {
                                        "chr":
                                            "11",
                                        "annots":
                                            []
                                    }
                                    ,
                                    {
                                        "chr":
                                            "12",
                                        "annots":
                                            []
                                    }
                                    ,
                                    {
                                        "chr":
                                            "13",
                                        "annots":
                                            []
                                    }
                                    ,
                                    {
                                        "chr":
                                            "14",
                                        "annots":
                                            []
                                    }
                                    ,
                                    {
                                        "chr":
                                            "15",
                                        "annots":
                                            []
                                    }
                                    ,
                                    {
                                        "chr":
                                            "16",
                                        "annots":
                                            []
                                    }
                                    ,
                                    {
                                        "chr":
                                            "17",
                                        "annots":
                                            []
                                    }
                                    ,
                                    {
                                        "chr":
                                            "18",
                                        "annots":
                                            []
                                    }
                                    ,
                                    {
                                        "chr":
                                            "19",
                                        "annots":
                                            []
                                    }
                                    ,
                                    {
                                        "chr":
                                            "20",
                                        "annots":
                                            []
                                    }
                                    ,
                                    {
                                        "chr":
                                            "21",
                                        "annots":
                                            []
                                    }
                                    ,
                                    {
                                        "chr":
                                            "22",
                                        "annots":
                                            []
                                    }
                                    ,
                                    {
                                        "chr":
                                            "X",
                                        "annots":
                                            []
                                    }
                                    ,
                                    {
                                        "chr":
                                            "Y",
                                        "annots":
                                            []
                                    }
                                ]
                            }
                        ;
                        response.data.markers.forEach(marker =>
                            result.annots.forEach(
                                subset => {
                                    if (subset.chr === marker.chr) {
                                        let chrom_ranges = {
                                            1: 249250621,
                                            2: 243199373,
                                            3: 198022430,
                                            4: 191154276,
                                            5: 180915260,
                                            6: 171115067,
                                            7: 159138663,
                                            8: 146364022,
                                            9: 141213431,
                                            10: 135534747,
                                            11: 135006516,
                                            12: 133851895,
                                            13: 115169878,
                                            14: 107349540,
                                            15: 102531392,
                                            16: 90354753,
                                            17: 81195210,
                                            18: 78077248,
                                            19: 59128983,
                                            20: 63025520,
                                            21: 48129895,
                                            22: 51304566,
                                            "X": 155270560,
                                            "Y": 59373566
                                        };
                                        let val = parseInt(marker.value);
                                        let bin = parseInt(marker.bin);
                                        let start = ((parseInt(marker.bin) * 3000000) - 3000000) + 1;
                                        let length = (start + 3000000) - 1 > chrom_ranges[marker.chr] ? chrom_ranges[marker.chr] - start : 3000000;
                                        let cat = "";
                                        if (val <= 10)
                                            cat = '#88F';
                                        else if (val > 10 && val <= 100)
                                            cat = '#ff8200';
                                        else if (val > 100)
                                            cat = '#F33';
                                        subset.annots.push([
                                            val.toString() + (val > 1 ? " markers" : " marker"),
                                            start,
                                            length,
                                            0,
                                            cat,
                                        ]);
                                    }
                                }
                            )
                        );
                        response.data.knockouts.forEach(knockout =>
                            result.annots.forEach(
                                subset => {
                                    if (subset.chr === knockout.chr) {
                                        let chrom_ranges = {
                                            1: 249250621,
                                            2: 243199373,
                                            3: 198022430,
                                            4: 191154276,
                                            5: 180915260,
                                            6: 171115067,
                                            7: 159138663,
                                            8: 146364022,
                                            9: 141213431,
                                            10: 135534747,
                                            11: 135006516,
                                            12: 133851895,
                                            13: 115169878,
                                            14: 107349540,
                                            15: 102531392,
                                            16: 90354753,
                                            17: 81195210,
                                            18: 78077248,
                                            19: 59128983,
                                            20: 63025520,
                                            21: 48129895,
                                            22: 51304566,
                                            "X": 155270560,
                                            "Y": 59373566
                                        };
                                        let val = parseInt(knockout.value);
                                        let bin = parseInt(knockout.bin);
                                        let start = ((parseInt(knockout.bin) * 3000000) - 3000000) + 1;
                                        let length = (start + 3000000) - 1 > chrom_ranges[knockout.chr] ? chrom_ranges[knockout.chr] - start : 3000000;
                                        let cat = "";
                                        if (val <= 10)
                                            cat = '#88F';
                                        else if (val > 10 && val <= 100)
                                            cat = '#ff8200';
                                        else if (val > 100)
                                            cat = '#F33';
                                        subset.annots.push([
                                            val.toString() + (val > 1 ? " knockouts" : " knockouts"),
                                            start,
                                            length,
                                            1,
                                            cat,
                                        ]);
                                    }
                                }
                            )
                        );
                        this.setState({markerData: result, loading: false});
                    }
                }
            }).catch((error) => {
            console.log(error);
        });
    }

    render() {
        let {loading, tabValue, termID, ontology, markerData} = this.state;
        return termID && ontology ?
            (
                <div><br/>
                    <Typography className="center">{ontology}: {termID}</Typography>
                    <br/>
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
                            markerData ? <AppIdeogram markerData={markerData} onAnnotationClick={this.onAnnotationClick} organism="human"/> :
                                <LoadingSpinner loading={loading}/>
                        }
                    </TabPanel>
                    <TabPanel value={tabValue} index={1} className="subTabMenu">
                        {
                            this.state.annotationSelected ? <GenomeBrowser chrom={this.state.annotationSelected.chr}
                                                                           start={this.state.annotationSelected.start}
                                                                           stop={this.state.annotationSelected.stop}/> : <GenomeBrowser/>
                        }
                    </TabPanel>
                </div>
            ) : <GenomeBrowser/>;
    }
}

export default withRouter(Genome);