; (function ($, window, undefined) {

    /**
     * Sets up our control over the DOM
     */
    var DOMController = function () {
        var self = this; 

        this.order = $('#order');
        this.payButton = $('#pay-button');
        this.overlay = $('#overlay');

        this.payButton.mousedown(function(){
            self.makeTransaction();
        });


        this.poller = new Poller();
        this.poller.onupdate = this.update.bind(this);
    

        tetra.weblet.on('hide', function () {
            if (poller.getTimerID()) {
                window.clearTimeout(poller.getTimerID());
            }
        });

        tetra.weblet.on('show', function () {
            if (poller.getTimerID()) {
                poller.resume();
            }
        });
    }


    DOMController.prototype.makeTransaction = function(){
        var total = this.poller.getOrderTotal();
        var transaction = new Transaction(total);
        transaction.make();
        this.overlay.toggleClass('hidden');

    }

    DOMController.prototype.update = function(order){
        
        var self = this;
        if(order.finished){
            this.makeTransaction();
            return;
        }   
        this.order.empty();
        $.each(order.line_items, function( index, value ) {
            self.addLineItem(value.line_item)
        });
        
        this.overlay.toggleClass('hidden');


    }

    DOMController.prototype.addLineItem = function(item){
        this.current
        this.order.append('<tr><td class="description">' + item.name + '</td><td class="price">' + item.price + '</td></tr>');
    }


    $(function () {

        $.ajax({
            url: 'https://rocky-sands-79934.herokuapp.com/orders/destroy/',
            type: 'DELETE',
            success: function(result) {
               window.setTimeout(function(){
                new DOMController();
            }, 15000)
            }
        });
        
    });

})(jQuery, window, null);

function Poller(){

    var self = this;

    ORDERS_ENDPOINT = 'https://rocky-sands-79934.herokuapp.com/orders.json';
    POLL_TIME = 15 /* Seconds */ * 1000 /* MS */;

    this.items = [];
    this.currentOrder = null;

    self.poll();
    
}

/**
 * TODO:
 * Move poller to another file
 */

Poller.prototype.poll = function(){
 $.get(ORDERS_ENDPOINT, this.process_.bind(this));
 this.timerId = null;
}

Poller.prototype.getOrderTotal = function(){

    var total = 0;
    for(var index = 0; index < this.currentOrder.line_items.length; index++){
        total += this.currentOrder.line_items[index].line_item.price;
    }

    return total;
}

Poller.prototype.process_ = function(data){
    console.log(data);
    var self = this;

    var last = data && data.orders ? data.orders[data.orders.length -1] : null;

    var isNoOrder = !this.currentOrder;
    var isNewOrder = this.currentOrder && this.currentOrder.id !== last.id;
    var isStateChanged = this.currentOrder && this.currentOrder.state !== last.state;
    var isItemsChanged = this.currentOrder && this.currentOrder.line_items.length !== last.line_items.length;
    var isOrderFinished = this.currentOrder && this.currentOrder.finished;

    if(isNoOrder || isNewOrder || isStateChanged || isItemsChanged || isOrderFinished) {
        this.currentOrder = last;
        this.onupdate(this.currentOrder);
    }

    

    
    this.timerId = window.setTimeout(function(){
        self.poll();
    }, POLL_TIME); 
}

Poller.prototype.resume = function(){
    
    var self = this;
    
    this.timerId = window.setTimeout(function(){
        self.poll();
    }, POLL_TIME); 
}

Poller.prototype.getTimerID = function(){
    return this.timerId;
}

/** Overwrite this method */
Poller.prototype.onupdate = function(order){
    console.log('Updating', this.currentOrder);
}

