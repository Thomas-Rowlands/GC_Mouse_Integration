import React from 'react';
import Typography from "@material-ui/core/Typography";
import {Box} from "@material-ui/core";

class TabPanel extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
    }


    render() {
        const {children, value, index, ...other} = this.props;
        return (
            <div role="tabpanel"
                 hidden={value !== index}
                 id={`full-width-tabpanel-${index}`}
                 aria-labelledby={`full-width-tab-${index}`}
                 {...other}>
                {value === index && (
                    <Box p={3}>
                        <Typography>{children}</Typography>
                    </Box>
                )}
            </div>
        );

    }
}


export default TabPanel;