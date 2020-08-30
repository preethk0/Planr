document.addEventListener('DOMContentLoaded', function() {
	var Calendar = FullCalendar.Calendar;
	var Draggable = FullCalendarInteraction.Draggable;

	var containerEl = document.getElementById('external-events');
	var calendarEl = document.getElementById('calendar');
	
	// load events
	var getEvents = [];
	$.ajax({
		url: "/load",
		type: "GET",
		success: function(data) {
			for(var i = 0; i < data.length; i++) {
				if(data[i].start != " ") {
					if(data[i].end != "") {
						var start = new Date(data[i].start);
						var end = new Date(data[i].end);
						var ev = {
							title: data[i].title,
							start: start.toISOString(),
							end: end.toISOString(),
							groupId: data[i].groupId
						}
					} else {
						var start = new Date(data[i].start);
						var ev = {
							title: data[i].title,
							start: start.toISOString(),
							end: data[i].end,
							groupId: data[i].groupId
						}
					}
					getEvents.push(ev);	
				}
			}
		}
	});
	console.log(getEvents);

	function setCursor(element) {
		var range, selection;
		range = document.createRange();
		range.selectNodeContents(element);
		range.collapse(false);
		selection = window.getSelection();
		selection.removeAllRanges();
		selection.addRange(range);
	}
  
	// create new event
	$("#new-event").click(function() {
		var div = document.createElement("div");
		var span = document.createElement("span");
		var groupId = Date.now().toString();

		span.setAttribute("class", "event-text");
		div.className = "fc-event";
		div.setAttribute("contentEditable", "true");
		div.setAttribute("onfocus", "this.value = this.value");
		div.setAttribute("onclick", "$(this).focus()");
		div.setAttribute("groupId", groupId);

		var node = document.createTextNode(" blank");
		span.appendChild(node);
		div.appendChild(span);
		div.addEventListener("click", function() {setCursor(div); });

		var element = document.getElementById("event-container");
		element.appendChild(div);

		var event = div;
		var title = event.textContent;
		event.groupId = groupId;
		event.start = " ";
		event.end = " ";
		
		$.ajax({
			url: "/home",
			type: "POST",
			data: {
				title: title,
				groupId: event.groupId,
				start: event.start,
				end: event.end
			},
			success: function(msg) {
				alert("Event created.")
			}
		});
		
		event.addEventListener("focusout", function() {
			var title = event.textContent;
			console.log(title);
			console.log(event.groupId);
			$.ajax({
				url: "/home",
				type: "PUT",
				data: {
					title: title,
					groupId: event.groupId,
					start: event.start,
					end: event.end
				},
				success: function(msg) {
					alert("Event updated.")
				}
			});
		});
	});
	
	function update(event) {
		return function() {
			var title = event.textContent;
			$.ajax({
				url: "/home",
				type: "PUT",
				data: {
					title: title,
					groupId: event.groupId,
					start: event.start,
					end:event.end
				},
				success: function(msg) {
					alert("Event updated.")
				}
			});
		}
	}
	
	var events = document.getElementsByClassName("fc-event");
	for(var i = 0; i < events.length; i++) {
		var event = events[i];
		event.addEventListener("focusout", update(event));
	}

	$("#todo-container").on("click", "li", function() {
		$(this).toggleClass("completed");
	});

	$("#todo-container").on("click", "span", function(event) {
		$(this).parent().fadeOut(500, function() {
			$(this).remove();
		})
		event.stopPropogation();
	});

	$("input[type='text']").keypress(function(event) {
		if(event.which === 13) {
			var newText = $(this).val();
			$(this).val("");
			$("ul").append("<li><span><i class='fas fa-trash'></i></span> " + newText + "</li>");
		}
	});

	$(".fa-plus").click(function() {
		$("input[type='text']").fadeToggle();
	}); 

	var myEditableElement = document.getElementsByClassName('fc-event');  

	var i;
	for(i = 0; i < myEditableElement.length; i++) {
		(function () {
			var element = myEditableElement[i];
			element.addEventListener("click", function() {setCursor(element); });
		}());
	}	  

	$("#event-container").sortable({
		update: function(event, ui) {
			var order = $(this).sortable('serialize');
		},
		helper: 'clone'
	});

	$("#delete-area").droppable({
		accept: '.fc-event',
		drop: function(event, ui) {
			ui.draggable.remove();
			$.ajax({
				url: "/home",
				type: "DELETE",
				data: {
					title: event.title,
					groupId: ui.draggable.attr("groupId"),
					start: event.start,
					end: event.end
				},
				success: function(msg) {
					alert("Event updated.")
				}
			});
		}
	});

	new Draggable(containerEl, {
		itemSelector: '.fc-event',
		eventData: function(eventEl) {
			return {
				title: eventEl.innerText,
				id: eventEl.groupId
			};
		}
	});  

	var calendar = new FullCalendar.Calendar(calendarEl, {
		plugins: [ 'dayGrid', 'timeGrid', 'list', 'interaction' ],
		defaultView: 'dayGridMonth',
		defaultDate: '2020-05-07',
		header: {
		  left: 'prev,next today',
		  center: 'title',
		  right: 'dayGridMonth,timeGridWeek,timeGridDay'
		},
		editable: true,
		droppable: true,
		events: getEvents,
		eventDragStop: function(info) {
			var event = info.event;
			var jsEvent = info.jsEvent;

			var trashEl = $('#delete-area');
			var ofs = trashEl.offset();

			var x1 = ofs.left;
			var x2 = ofs.left + trashEl.outerWidth(true);
			var y1 = ofs.top;
			var y2 = ofs.top + trashEl.outerHeight(true);

			if (jsEvent.pageX >= x1 && jsEvent.pageX<= x2 && jsEvent.pageY >= y1 && jsEvent.pageY <= y2) {
				$.ajax({
					url: "/home",
					type: "DELETE",
					data: {
						title: event.title,
						groupId: event.groupId,
						start: event.start,
						end: event.end
					},
					success: function(msg) {
						alert("Event updated.")
					}
				});
				event.remove();
			}
		},
		eventReceive: function(info) {
			var event = info.event;
			var groupId = Date.now().toString();
			console.log(event);
			event.setProp("groupId", groupId);
			$.ajax({
				url: "/home",
				type: "POST",
				data: {
					title: event.title,
					groupId: groupId,
					start: event.start,
					end: event.end
				},
				success: function(msg) {
					alert("Event updated.")
				}
			});
		},
		eventDrop: function(eventDropInfo) {
			var event = eventDropInfo.event;
			$.ajax({
				url: "/home",
				type: "PUT",
				data: {
					title: event.title,
					groupId: event.groupId,
					start: event.start,
					end: event.end
				},
				success: function(msg) {
					alert("Event updated.")
				}
			});
		},
		eventResize: function(eventResizeInfo) {
			var event = eventResizeInfo.event;
			$.ajax({
				url: "/home",
				type: "PUT",
				data: {
					title: event.title,
					groupId: event.groupId,
					start: event.start,
					end: event.end
				},
				success: function(msg) {
					alert("Event updated.")
				}
			});
		},
		dragRevertDuration: 0
	});

	calendar.render();
});