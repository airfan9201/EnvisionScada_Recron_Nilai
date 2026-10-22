if (ProgrammerMode) {
    const flexGroup = document.getElementById('flexGroup');
    const flexChildren = [];

    //var dummycolor = document.getElementById('dummycolor');

    //for(let i = 0; i < 64; i++) {
    //    let div = dummycolor.cloneNode(true);
    //    div.style.display = 'block';
    ///*    div.innerHTML = `<div class="drag">drag me</div>`;*/
    //    flexChildren.push(div);
    //}

    flexGroup.append(...flexChildren);
    new Sortable(
        flexGroup,
        {
            animation: 200,
            chosenClass: 'chosen',
            draggable: (e) => {
                return e.target.tagName === 'DIV' ? true : false
            },
            onDrag: (e) => {
                //console.log(e, 'ondrag')
                ColorLibraryChangeNameModalCancel();

                DeselectAllColorLibraryCards();

                e.classList.add("ActiveColorLibraryCard");

            },
            onDrop: (changed) => {
                //console.log(changed, 'changed')
            },
            onChange: (from, to) => {
                //console.log(from, to)
            }
        }
    );
}