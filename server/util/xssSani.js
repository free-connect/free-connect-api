const saniContact = (value) => {
    const newVal = value.replace(/</g, '&gt;').replace(/>/g, '&lt;');
    return newVal
}

module.exports = saniContact