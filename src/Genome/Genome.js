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
                        <GenomeBrowser />
                    </TabPanel>
                </div>
            ) : <GenomeBrowser />;
    }
}

export default withRouter(Genome);