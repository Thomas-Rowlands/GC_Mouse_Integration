import React, {Component} from "react";
import {Slider, Typography} from "@material-ui/core";

class RangeSlider extends Component {

    constructor(props) {
        super(props);
        this.state = {
            rangeVal: [0, 10],
        }
    }

    handleChange = (event, newValue) => {
        this.setState({rangeVal: newValue});
        this.props.onValueChange(newValue);
    }

    getValueText = (value) => {
        return value.toString();
    }

    render() {
        return (
            <div>
                <Typography id="range-slider" gutterBottom>
                    {this.props.title}
                </Typography>
                <Slider
                    value={this.state.rangeVal}
                    onChange={(event, newValue) => this.handleChange(event, newValue, this)}
                    valueLabelDisplay="auto"
                    aria-labelledby="range-slider"
                    min={0}
                    max={40}
                    getAriaValueText={this.getValueText}
                />
            </div>

        )
            ;
    }
}

export default RangeSlider;