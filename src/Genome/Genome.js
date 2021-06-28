import React from "react";
import AppIdeogram from "./Components/AppIdeogram";

class Genome extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            loading: false,
        };
    }

    render() {
        return (
            <div>
                <AppIdeogram />
            </div>
        );
    }
}

export default Genome;