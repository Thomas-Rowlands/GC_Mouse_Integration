import React, {useCallback} from 'react';
import {Paper, withStyles} from "@material-ui/core";
import './MainMenuItem.css';
import Typography from "@material-ui/core/Typography";

const useStyles = theme => ({
    paper: {
        padding: theme.spacing(2),
        textAlign: 'center',
        color: theme.palette.text.secondary,
        height: 500,
        zIndex: 1,
        position: 'relative',
        border: "solid 1px black",
        width: "100%",
    },
    img: {
        width: 100,
        marginTop: "10%",
    },
    header: {
        textDecoration: "none",
        marginTop: "5%",
        position: "absolute",
        textAlign: "center",
        width: "90%",
    },
    text: {
        textDecoration: 'none',
        marginTop: "30%",
        position: "absolute",
    }
});

class MainMenuItem extends React.Component {

    state = {isZoomed: false};

    toggle = () => {
        this.setState({
            isZoomed: !this.state.isZoomed
        });
    }

    render() {
        const {classes} = this.props;
        const {isZoomed} = this.state;

        return (
            <Paper style={{transform: this.state.isZoomed ? 'scale(1.1)' : 'scale(1)',
                transition: this.state.isZoomed ? '0.3s' :  '0.3s', zIndex: this.state.isZoomed ? 99 :  1}}
                   onMouseEnter={() => this.toggle()}
                   onMouseLeave={() => this.toggle()} className={classes.paper}>
                <img className={classes.img} src={this.props.image} alt={this.props.alt}/>
                <Typography className={classes.header} variant='h5' gutterBottom>{this.props.heading}</Typography>
                <Typography className={classes.text} variant='body1' gutterBottom>{this.props.body}</Typography>
            </Paper>);
    }
}

export default withStyles(useStyles)(MainMenuItem);