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
    }

    getIdeogram = () => {
        if (this.props.markerData) {
            if (this.state.openChromosome)
                return new Ideogram({
                    organism: this.props.organism,
                    assembly: "GRCh37",
                    container: '#ideo-container',
                    chrHeight: 1500,
                    chrWidth: 35,
                    chromosome: this.state.openChromosome,
                    orientation: "horizontal",
                    annotationsLayout: 'histogram',
                    barWidth: 3,
                    annotations: this.props.markerData,
                    brush: "chr" + this.state.openChromosome + ":1-10000",
                    onBrushMove: this.writeSelectedRange,
                    onLoad: this.writeSelectedRange,
                    onDidRotate: this.onDidRotate
                });
            else
                return new Ideogram({
                    organism: this.props.organism,
                    assembly: "GRCh37",
                    container: '#ideo-container',
                    chrHeight: 600,
                    chrWidth: 15,
                    annotationsLayout: 'histogram',
                    barWidth: 3,
                    annotations: this.props.markerData,
                    onDidRotate: this.onDidRotate
                });
        }
    }

    writeSelectedRange = () => {
        let r = Ideogram.selectedRegion;
        if (r) {
            let from = r.from.toLocaleString(); // Adds thousands-separator
            let to = r.to.toLocaleString();
            let extent = r.extent.toLocaleString();

            document.getElementById('from').innerHTML = from;
            document.getElementById('to').innerHTML = to;
            document.getElementById('extent').innerHTML = extent;
        }
    }

    onDidRotate = (e) => {
        if (e.oldWidth < e.width) { // Expanded
            this.setState({openChromosome: e.name});
        } else {
            this.setState({openChromosome: null});
        }
    }

    expandIdeogram = () => {
        this.setState({openChromosome: null});
    }

    render() {
        if (this.props.markerData)
            this.getIdeogram();
        return (
            <div>
                {
                    this.state.openChromosome ? <br /> : null
                }
                {
                    this.state.openChromosome ? <Button size="small" color="primary" variant="contained" onClick={this.expandIdeogram}>Back</Button> : null
                }
                <div id="ideo-container"/>
            </div>

        );
    }
}

export default AppIdeogram