import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
    Slide,
    withStyles
} from "@material-ui/core";
import InfoIcon from "@material-ui/icons/Info";

const useStyles = theme => ({
    container: {
        width:"max-content",
        display:"contents"
    },
    content: {
        whiteSpace:"pre-line"
    },
});

class InfoDialog extends React.Component {
    constructor() {
        super();
        this.state = {open: false};
        this.Transition = React.forwardRef(function Transition(props, ref) {
            return <Slide direction="up" ref={ref} {...props} />;
        });
    }


    render() {
        const {classes} = this.props;
        return (
            <div className={classes.container}>
                <IconButton color="primary" aria-label="help" onClick={() => this.setState({open: !this.state.open})}>
                    <InfoIcon/>
                </IconButton>
                <Dialog maxWidth={"sm"} fullWidth={true} onClose={() => this.setState({open: !this.state.open})} open={this.state.open}
                        TransitionComponent={this.Transition}>
                    <DialogTitle>{this.props.title}</DialogTitle>
                    <DialogContent>
                        <DialogContentText className={classes.content}>{this.props.contentText}</DialogContentText>
                    </DialogContent>
                </Dialog>
            </div>


        );
    }
}

export default withStyles(useStyles)(InfoDialog);