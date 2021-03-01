import {Button, Paper, withStyles} from "@material-ui/core";
import {fade} from "@material-ui/core/styles";
import {animated, useSpring} from "react-spring/web.cjs";
import Collapse from "@material-ui/core/Collapse";
import PropTypes from "prop-types";
import React from "react";
import TreeView from "@material-ui/lab/TreeView";
import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown";
import ArrowRightIcon from "@material-ui/icons/ArrowRight";
import SearchIcon from "@material-ui/icons/Search";
import CircularProgress from "@material-ui/core/CircularProgress";
import StyledTreeItem from "./Components/StyledTreeItem";

const useStyles = theme => ({
    root: {
        flexGrow: 1,
        marginTop: 20,
        marginLeft: 5,
    },
    highlight: {
        backgroundColor: "#a6a6ff",
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
        };
        this.tempExpandedIds = [];
    }

    getTreeNodes = (nodes) => {
        const {classes} = this.props;
        const btn = <Button size="small" onClick={() => this.termSearchBtnClick(nodes.FSN)} color="primary"
                            variant="outlined" id={nodes.id}
        ><SearchIcon fontSize="small"/></Button>;
        const tempChildNode = ("hasChildren" in nodes) && !("isa" in nodes) ?
            <StyledTreeItem labelText={<CircularProgress color="inherit" size={15}/>}/> : null;
        return (
            <StyledTreeItem onLabelClick={(e) => e.preventDefault()} key={nodes.id} nodeId={nodes.id}
                            labelText={nodes.FSN} labelIcon={btn}>
                {Array.isArray(nodes.isa) ? nodes.isa.map((node) => this.getTreeNodes(node)) : tempChildNode}
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
            <TreeView className={classes.root} expanded={this.props.expandedNodes}
                      selected={this.props.selectedNodes}
                      defaultCollapseIcon={<ArrowDropDownIcon/>} defaultExpandIcon={<ArrowRightIcon/>}
                      defaultEndIcon={<div style={{width: 24}}/>} onNodeToggle={this.props.onToggle}
                      onNodeSelect={this.props.onSelect}>
                {this.getTreeNodes(this.props.treeData)}
            </TreeView>
        );

    }

}

export default withStyles(useStyles)(OntologyTree);

