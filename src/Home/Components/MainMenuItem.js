import React, {useCallback} from 'react';
import {Paper, withStyles} from "@material-ui/core";
import './MainMenuItem.css';
import Typography from "@material-ui/core/Typography";

const useStyles = theme => ({
  paper: {
    padding: theme.spacing(2),
    textAlign: 'center',
    color: theme.palette.text.secondary,
      '&:hover': {
        transform: 'scale(1.15)',
      }
  },
    img: {
          width: 100,
    },
    text:{
      textDecoration: 'none',
    }
});

class MainMenuItem extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const {classes} = this.props;
        return (<Paper className={classes.paper}>
                <img className={classes.img} src={this.props.image} alt={this.props.alt}/>
                <Typography className={classes.text} variant='h5' gutterBottom>{this.props.heading}</Typography>
                <Typography className={classes.text} variant='body1' gutterBottom>{this.props.body}</Typography>
        </Paper>);
    }
}
export default withStyles(useStyles)(MainMenuItem);