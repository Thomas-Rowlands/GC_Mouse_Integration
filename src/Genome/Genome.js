import React from "react";
import AppIdeogram from "./Components/AppIdeogram";
import LoadingSpinner from "../UtilityComponents/LoadingSpinner/LoadingSpinner";
import {AppBar, Tab, Tabs} from "@material-ui/core";
import TabPanel from "../UtilityComponents/TabPanel";


class Genome extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            tabValue: 0
        };
    }

    render() {
        let {loading, tabValue} = this.state;
        return (
            <div>
                <LoadingSpinner loading={loading}/>
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
                    <AppIdeogram termID="D005227" ontology="mesh" organism="human"/>
                </TabPanel>
                <TabPanel value={tabValue} index={1} className="subTabMenu">
                </TabPanel>

            </div>
        );
    }
}

export default Genome;