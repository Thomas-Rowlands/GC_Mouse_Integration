import React, {Component} from "react";
import Ideogram from "ideogram";
import './AppIdeogram.css'
import {Button} from "@material-ui/core";

class AppIdeogram extends Component {

    constructor(props) {
        super(props);
        this.state = {
            openChromosome: null,
        }
        this.brushStart = 17487076;
        this.brushStop = 41901071;
        this.brushExtent = 0;
        this.ideogram = null;
        this.singleIdeogram = null;
    }

    componentDidMount() {
        this.getIdeogram();
    }

    getIdeogram = () => {
        if (this.props.markerData) {
            if (this.state.openChromosome) {
                this.singleIdeogram = new Ideogram({
                    organism: this.props.organism,
                    assembly: "GRCh37",
                    container: '#ideo-container-single',
                    chrHeight: 1500,
                    chrWidth: 35,
                    chromosome: this.state.openChromosome,
                    orientation: "horizontal",
                    annotationsLayout: 'histogram',
                    barWidth: 3,
                    annotations: this.props.markerData,
                    brush: "chr" + this.state.openChromosome + ":1-2",
                    onBrushMove: () => this.writeSelectedRange(this),
                    onLoad: () => this.writeSelectedRange(this),
                    onDidRotate: this.onDidRotate
                });
            } else {
                this.ideogram = new Ideogram({
                    organism: this.props.organism,
                    assembly: "GRCh37",
                    container: '#ideo-container',
                    chrHeight: 600,
                    chrWidth: 15,
                    annotationsLayout: 'histogram',
                    barWidth: 3,
                    annotations: this.props.markerData,
                    onDidRotate: this.onDidRotate,
                });
            }
            return this.ideogram;
        }
    }

    transitionIdeogram = () => {
        this.getIdeogram();

    }

    writeSelectedRange = (self) => {
        let r = self.singleIdeogram.selectedRegion;
        if (r) {
            self.brushStart = r.from.toLocaleString(); // Adds thousands-separator
            self.brushStop = r.to.toLocaleString();
            self.brushExtent = r.extent.toLocaleString();
            self.getBrushMarkers();
        }
    }

    onDidRotate = (e) => {
        if (e.oldWidth < e.width) { // Expanded
            this.setState({openChromosome: e.name});
        } else {
            this.setState({openChromosome: null});
        }
        this.getIdeogram();
    }

    expandIdeogram = (self) => {
        self.setState({openChromosome: null});
        self.getIdeogram();
    }

    getBrushMarkers = () => {
        let chromosome = this.state.openChromosome;
        let brushStart = this.brushStart;
        let brushStop = this.brushStop;
        let filteredMarkers = this.props.markerData.filter(function (marker) {
            return marker.chr === chromosome && marker.start >= parseInt(brushStart) && marker.stop <= parseInt(brushStop);
        });
        let container = document.getElementById("marker-container");
        container.innerHTML = filteredMarkers.map((marker) =>
            <p>marker.name</p>
        );
    }

    render() {
        return (
            <div>
                {
                    this.state.openChromosome ? <br/> : null
                }
                {
                    this.state.openChromosome ? <Button size="small" color="primary" variant="contained"
                                                        onClick={() => this.expandIdeogram(this)}>Back</Button> : null
                }
                <div id="ideo-container" style={this.state.openChromosome ? {display: "none"} : {display:"unset"}}/>
                <div id="ideo-container-single" style={this.state.openChromosome ? {display: "unset"} : {display:"none"}}/>
                <div id="marker-container"></div>
            </div>
        );
    }
}

export default AppIdeogram