import {Button, Paper, withStyles} from "@material-ui/core";
import {fade} from "@material-ui/core/styles";
import {animated, useSpring} from "react-spring/web.cjs";
import Collapse from "@material-ui/core/Collapse";
import PropTypes from "prop-types";
import React from "react";
import TreeView from "@material-ui/lab/TreeView";
import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown";
import ArrowRightIcon from "@material-ui/icons/ArrowRight";
import LinearScaleIcon from '@material-ui/icons/LinearScale';
import CircularProgress from "@material-ui/core/CircularProgress";
import StyledTreeItem from "./Components/StyledTreeItem";
import _ from 'lodash';

const useStyles = theme => ({
    root: {
        marginTop: 20,
        marginLeft: 5,
        overflowY: "scroll",
        height: "70vh",
    },
    highlight: {
        backgroundColor: "#a6a6ff",
    },
    btn: {
        marginRight: 20,
    }
});

function TransitionComponent(props) {
    const style = useSpring({
        from: {opacity: 0, transform: 'translate3d(20px,0,0)'},
        to: {opacity: props.in ? 1 : 0, transform: `translate3d(${props.in ? 0 : 20}px,0,0)`},
    });
    return (
        <animated.div style={style}>
            <Collapse {...props} />
        </animated.div>
    );
}

TransitionComponent.propTypes = {
    /**
     * Show the component; triggers the enter or exit states
     */
    in: PropTypes.bool,
};

class OntologyTree extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            treeData: null,
            expandedNodes: [''],
            selectedNodes: [''],
            selectedSpecies: "Mouse",
            onToggle: null,
            onSelect: null,
            onBtnClick: null,
            sourceOntology: "",
            mappingOntology: "",
            selectedPhenotypeLabel: "",
            treeID: "",
        };
        this.tempExpandedIds = [];
    }

    getTreeNodes = (nodes) => {
        const {classes} = this.props;
        const btn = nodes.hasMapping ?
            <Button className={classes.btn} size="small" onClick={() => this.props.onBtnClick(nodes.label)}
                   style={{margin: 0}} color="primary" variant="outlined" id={nodes.id}
            ><LinearScaleIcon fontSize="small"/></Button> : null;
        const tempChildNode = (nodes.hasChildren === true) && (_.isEmpty(nodes.children)) ?
            <StyledTreeItem labelText={<CircularProgress color="inherit" size={15}/>}/> : null;
        if (!_.isEmpty(nodes.children)) {
            nodes.children = _.orderBy(nodes.children, ['label'], ['asc']); // all nodes must be sorted alphabetically!
        }
        return (
            <StyledTreeItem id={this.props.treeID + "-" + nodes.id.replace(":", "-")} onLabelClick={(e) => e.preventDefault()} key={nodes.id} nodeId={nodes.id}
                            labelText={nodes.label} labelIcon={btn}>
                {!_.isEmpty(nodes.children) ? Object.keys(nodes.children).map((key, index) => this.getTreeNodes(nodes.children[key])) : tempChildNode}
            </StyledTreeItem>
        );
    }

    setExpandedSourceNodes = (nodes, ids) => {
        if (Array.isArray(ids[0]))
            ids = ids[0];
        ids.push(nodes.id);
        this.tempExpandedSourceIds = ids;
        return Array.isArray(nodes.isa) ? nodes.isa.map((node) => this.setExpandedSourceNodes(node, ids)) : ids;
    }


    render() {
        const {classes} = this.props;
        const {
            loading,
        } = this.state;
        if (this.props.treeData === null || this.props.treeData === undefined) {
            throw new Error('No ontology data received.');
        }
        return (
            <TreeView id={this.props.treeID} className={classes.root} expanded={this.props.expanded}
                      selected={this.props.selected}
                      defaultCollapseIcon={<ArrowDropDownIcon/>} defaultExpandIcon={<ArrowRightIcon/>}
                      defaultEndIcon={<div style={{width: 24}}/>} onNodeToggle={this.props.onToggle}
                      onNodeSelect={this.props.onSelect}>
                {this.getTreeNodes(this.props.treeData)}
            </TreeView>
        );

    }

}

export default withStyles(useStyles)(OntologyTree);

