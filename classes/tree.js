/**
 * Created by georgius on 14.08.2018.
 */
const cloneDeep = require('lodash.clonedeep')
class Tree {
  constructor () {
    this.clear()
  }

  clear () {
    this.nodes = {}
    this.children = {}
  }

  serialize () {
    return JSON.stringify({
      nodes: this.nodes,
      children: this.children
    })
  }

  deserialize (src) {
    const { nodes, children } = JSON.parse(src)
    this.nodes = nodes
    this.children = children
  }
  
  remap () {
    const keys = Object.keys(this.nodes)
    keys.forEach(key => {
      this.nodes[key].level = this.getLevel(key)
      this.nodes[key].hasChildren = Boolean(this.children[key])
    })
  }
  
  add (id, parent, text, data) {
    const node = {
      id, parent, text, data
    }
    this.nodes[id] = node
    node.level = this.getLevel(id)
    if (!this.children[parent]) {
      this.children[parent] = [id]
    } else {
      this.children[parent].push(id)
    }
    return node
  }

  get (id) {
    let node = this.nodes[id]
    if (node) {
      return cloneDeep(node)
    }
  }

  getLevel (id) {
    let node = this.get(id)
    if (this.nodes[id]) {
      return this.getLevel(node.parent) + 1 
    } else {
      return -1
    }
  }
  
  getChildren(parent) {
    if (!this.children[parent]) {
      return []
    } else {
      return this.children[parent]
    }
  }

  getParents(id, skip = 0) {
    let parents = []
    const track = (id) => {
      if (this.nodes[id]) {
        parents.unshift(id)
        track(this.nodes[id].parent)
      }
    }
    if (this.nodes[id]) {
      track(this.nodes[id].parent)
    }
    if (skip) {
      parents.splice(0, skip)
    }
    return parents
  }
  
  getDescendants(parent) {
    const descendants = []
    const enumChildrens = (parent) => {
      const children = this.getChildren(parent)
      children.forEach(id => {
        descendants.push(id)
        enumChildrens(id)
      })
    }
    enumChildrens(parent)
    return descendants
  }

  getPath (id, separator = '/', skip = 0, maxLength = 0, ending = '…') {
    let parents = this.getParents(id, skip)
    const path = []
    const node = this.get(id)
    if (node) {
      parents.forEach(id => {
        const parent = this.nodes[id]
        let name = parent.text
        if (maxLength) {
          name = truncate(name, maxLength, ending)
        }
        path.push(name)
      })
      // Сама нода
      if (maxLength) {
        path.push(truncate(node.text, maxLength, ending))
      } else {
        path.push(node.text)
      }
      return path.join(separator)
    }
  }
}

function truncate (str, length, ending) {

  if (!length || length < 0) {
    length = 128
  }

  if (!ending) {
    ending = '...'
  }

  if (str.length > length) {
    return str.substring(0, length - ending.length) + ending
  } else {
    return str
  }
}

module.exports = Tree