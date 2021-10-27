import React from 'react';
import {Dialog, DialogContent, DialogContentText, DialogTitle} from "@material-ui/core";

class InfoDialog extends React.Component {
    constructor() {
        super();
    }

    render() {
        return (
            <Dialog onClose={this.props.onClose} open={this.props.open}>
              <DialogTitle>{this.props.title}</DialogTitle>
              <DialogContent>
                  <DialogContentText>{this.props.contentText}</DialogContentText>
              </DialogContent>
            </Dialog>
        );
    }
}

export default InfoDialog;