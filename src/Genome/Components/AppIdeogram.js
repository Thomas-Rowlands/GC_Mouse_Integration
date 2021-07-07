import React, {Component} from "react";
import Ideogram from "ideogram";
import './AppIdeogram.css'
import "./Ideogram.css";
import axios from "axios";
import api_server from "../../UtilityComponents/ConfigData";
import LoadingSpinner from "../../UtilityComponents/LoadingSpinner/LoadingSpinner";

class AppIdeogram extends Component {

    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            markerData: null,
            configData: api_server
        };
    }

    componentDidMount() {
        if (!this.state.markerData) {
            this.getHumanMarkerData(this.props.termID, this.props.ontology);
        }
        return this.getIdeogram();
    }

    getIdeogram = () => {
        if (this.state.markerData)
            return new Ideogram({
                organism: this.props.organism,
                assembly: "GRCh37",
                container: '#ideo-container',
                chrHeight: 600,
                chrWidth: 15,
                annotations: this.state.markerData
            });
    }

    getHumanMarkerData = (termID, ontology) => {
        let url_string = this.state.configData.api_server + "controller.php?type=genome&phenotype=" + termID + "&ontology=" + ontology;
        axios.get(url_string)
            .then((response) => {
                if (response.status === 200) {
                    if (response.data) {
                        let result = [];
                        response.data.forEach(marker =>
                            result.push({"name": marker.name, "chr": marker.chr, "start": parseInt(marker.start), "stop": parseInt(marker.stop)})
                        );
                        this.setState({markerData: result, loading: false});
                        this.getIdeogram();
                    }
                }
            })
    }

    render() {
        return (
            <div>
                <LoadingSpinner loading={this.state.loading}/>
                <div id="ideo-container"/>
            </div>

        );
    }
}

export default AppIdeogram