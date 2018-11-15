/**
 * Created by georgius on 14.08.2018.
 */
const assert = require('chai').assert
// const should = chai.should()
const Tree = require('../classes/tree')

describe('tree class', () => {
  let tree
  it('Creates', async function() {
    tree = new Tree()
    assert.isOk(tree)
  })
  it('Adds 12 items', async () => {
    tree.add(1, 0, 'folder 1', {})
    tree.add(2, 0, 'folder 2', {})
    tree.add(3, 0, 'folder 3', {})

    tree.add(4, 1, 'node 1', {})
    tree.add(5, 1, 'node 2', {})
    tree.add(6, 1, 'node 3', {})

    tree.add(7, 2, 'node 1', {})
    tree.add(8, 2, 'node 2', {})
    tree.add(9, 2, 'node 3', {})

    tree.add(10, 3, 'node 1', {})
    tree.add(11, 3, 'node 2', {})
    tree.add(12, 3, 'node 3', {})

    tree.add(13, 12, 'node 13', {})

    tree.remap()

    const keys = Object.keys(tree.nodes)
    assert.equal(keys.length, 13)

    const childs = tree.children[0]
    assert.equal(childs.length, 3)

  })
  it ('Root has 3 childrens', () => {
    const childs = tree.getChildren(0)
    assert.equal(childs.length, 3)
  })
  it ('First folder has 3 childs', () => {
    const childs = tree.getChildren(1)
    assert.equal(childs.length, 3)
  })
  it('Root has descendants', () => {
    const descendants = tree.getDescendants(0)
    assert.deepEqual(descendants, [ 1, 4, 5, 6, 2, 7, 8, 9, 3, 10, 11, 12, 13])
  })
  it('Node #12 has level 1', () => {
    let node = tree.get(12)
    assert.equal(node.level, 1)
  })
  it('Node #1 has level 0', () => {
    let node = tree.get(1)
    assert.equal(node.level, 0)
  })
  it('Root node not exists', () => {
    let node = tree.get(0)
    assert.notOk(node)
  })
  it('Node #13 has 2 parents', () => {
    let parents = tree.getParents(13)
    assert.deepEqual(parents, [3, 12])
    parents = tree.getParents(13, 1)
    assert.deepEqual(parents, [12])
  })
  it('Node #13 has level 2', () => {
    tree.remap()
    let node = tree.get(13)
    assert.equal(node.level, 2)
  })

  it('Node #13 has path', () => {
    let path1 = tree.getPath(13, ' / ', 0, 10)
    assert.equal(path1, 'folder 3 / node 3 / node 13')
    let path2 = tree.getPath(13, ' / ', 0, 7, '...')
    assert.equal(path2, 'fold... / node 3 / node 13')
    let path3 = tree.getPath(13, ' / ', 1, 10)
    assert.equal(path3, 'node 3 / node 13')
    let path4 = tree.getPath(13, ' / ', 1, -1)
    assert.equal(path4, 'node 3 / node 13')
    let path5 = tree.getPath(13, ' / ', 1)
    assert.equal(path5, 'node 3 / node 13', false, false)
    let path6 = tree.getPath(13, ' / ', 0, 7, false)
    assert.equal(path6, 'fold... / node 3 / node 13')
  })

  it('Tree is serializable', () => {
    const s = tree.serialize()
    assert.equal(s, '{"nodes":{"1":{"id":1,"parent":0,"text":"folder 1","data":{},"level":0,"hasChildren":true},"2":{"id":2,"parent":0,"text":"folder 2","data":{},"level":0,"hasChildren":true},"3":{"id":3,"parent":0,"text":"folder 3","data":{},"level":0,"hasChildren":true},"4":{"id":4,"parent":1,"text":"node 1","data":{},"level":1,"hasChildren":false},"5":{"id":5,"parent":1,"text":"node 2","data":{},"level":1,"hasChildren":false},"6":{"id":6,"parent":1,"text":"node 3","data":{},"level":1,"hasChildren":false},"7":{"id":7,"parent":2,"text":"node 1","data":{},"level":1,"hasChildren":false},"8":{"id":8,"parent":2,"text":"node 2","data":{},"level":1,"hasChildren":false},"9":{"id":9,"parent":2,"text":"node 3","data":{},"level":1,"hasChildren":false},"10":{"id":10,"parent":3,"text":"node 1","data":{},"level":1,"hasChildren":false},"11":{"id":11,"parent":3,"text":"node 2","data":{},"level":1,"hasChildren":false},"12":{"id":12,"parent":3,"text":"node 3","data":{},"level":1,"hasChildren":true},"13":{"id":13,"parent":12,"text":"node 13","data":{},"level":2,"hasChildren":false}},"children":{"0":[1,2,3],"1":[4,5,6],"2":[7,8,9],"3":[10,11,12],"12":[13]}}')
  })

  it('Tree is deserializable', () => {
    const s = '{"nodes":{"1":{"id":1,"parent":0,"text":"folder 1","data":{},"level":0,"hasChildren":true},"2":{"id":2,"parent":0,"text":"folder 2","data":{},"level":0,"hasChildren":true},"3":{"id":3,"parent":0,"text":"folder 3","data":{},"level":0,"hasChildren":true},"4":{"id":4,"parent":1,"text":"node 1","data":{},"level":1,"hasChildren":false},"5":{"id":5,"parent":1,"text":"node 2","data":{},"level":1,"hasChildren":false},"6":{"id":6,"parent":1,"text":"node 3","data":{},"level":1,"hasChildren":false},"7":{"id":7,"parent":2,"text":"node 1","data":{},"level":1,"hasChildren":false},"8":{"id":8,"parent":2,"text":"node 2","data":{},"level":1,"hasChildren":false},"9":{"id":9,"parent":2,"text":"node 3","data":{},"level":1,"hasChildren":false},"10":{"id":10,"parent":3,"text":"node 1","data":{},"level":1,"hasChildren":false},"11":{"id":11,"parent":3,"text":"node 2","data":{},"level":1,"hasChildren":false},"12":{"id":12,"parent":3,"text":"node 3","data":{},"level":1,"hasChildren":true},"13":{"id":13,"parent":12,"text":"node 13","data":{},"level":2,"hasChildren":false}},"children":{"0":[1,2,3],"1":[4,5,6],"2":[7,8,9],"3":[10,11,12],"12":[13]}}'
    tree.deserialize(s)
    let node = tree.get(13)
    assert.equal(node.level, 2)
  })

})
