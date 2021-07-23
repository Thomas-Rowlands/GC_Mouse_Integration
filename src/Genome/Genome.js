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
                        let result = {
                                "metadata": {
                                    "species": "human",
                                    "assembly": "GRCh37",
                                    "numTracks": 2,
                                    "trackLabels": [
                                        "Human Markers",
                                        "Human Genes"
                                    ]
                                },
                                "keys": [
                                    "name",
                                    "start",
                                    "length",
                                    "pval",
                                    "count",
                                    "trackIndex"
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
                                        let num = parseInt(Math.floor(Math.random() * 150) + 1);
                                        let cat = "";
                                        if (1 <= num && num <= 50)
                                            cat = "low";
                                        else if (51 <= num && num <= 99)
                                            cat = "mid";
                                        else if (num >= 100)
                                            cat = "high";
                                        subset.annots.push([
                                            marker.name,
                                            parseInt(marker.start),
                                            Math.max(parseInt(marker.stop) - parseInt(marker.start), 1),
                                            parseFloat(marker.pval),
                                            cat,
                                            0
                                        ]);
                                    }
                                }
                            )
                        )
                        response.data.genes.forEach(gene =>
                            result.annots.forEach(
                                subset => {
                                    if (subset.chr === gene.chr) {
                                        subset.annots.push([
                                            gene.gene_symbol,
                                            parseInt(gene.start),
                                            Math.max(parseInt(gene.stop) - parseInt(gene.start), 1),
                                            0,
                                            "gene",
                                            1
                                        ]);
                                    }
                                }
                            )
                        )
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
                        <GenomeBrowser/>
                    </TabPanel>
                </div>
            ) : <GenomeBrowser/>;
    }
}

export default withRouter(Genome);